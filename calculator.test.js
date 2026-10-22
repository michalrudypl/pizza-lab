'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('./calculator');
const calc=s=>R.calculate({...R.defaults,...s});
const biga={method:'biga',share:50,ph:16,preferTemp:17,bulk:.5,proof:2};
const coldPoolish={method:'poolish',preferMode:'cold',ph:1,pcold:24};
const reject=(s,field)=>assert.ok(calc(s).errors.some(e=>e.field===field),JSON.stringify(s));
test('poolish 50 h is blocked in room and refrigerated modes, independent of final TK',()=>{
 for(let temp=16;temp<=28;temp++){reject({ph:50,preferTemp:temp,cold:24},'ph');reject({...coldPoolish,ph:50,preferTemp:temp},'ph');}
 reject({...coldPoolish,pcold:50},'pcold');
});
test('warm poolish boundaries depend on the preferment temperature, not final room temperature',()=>{
 for(const [preferTemp,ph] of [[16,18],[20,18],[21,16],[23,16],[24,12],[26,12],[27,8],[28,8]]){
  assert.equal(calc({preferTemp,ph}).errors.length,0);reject({preferTemp,ph:ph+.5},'ph');
 }
});
test('cold poolish has a separate warm start, cold stage and final cold phase',()=>{
 const r=calc({...coldPoolish,cold:24});assert.equal(r.errors.length,0);
 assert.equal(r.steps.find(s=>s.kind==='preferCold').hours,24);
 assert.equal(r.steps.find(s=>s.kind==='cold').hours,24);
 assert.equal(r.hours,54.5);
 reject({...coldPoolish,ph:3},'ph');reject({...coldPoolish,pcold:10},'pcold');reject({...coldPoolish,fridge:8},'fridge');
});
test('biga uses its own hydration and cool-room limits, including 100% flour in biga',()=>{
 const r=calc({...biga,share:100});assert.equal(r.errors.length,0);assert.equal(r.ff,0);assert.ok(Math.abs(r.pw/r.pf-.45)<1e-10);
 reject({...biga,preferTemp:24},'preferTemp');reject({...biga,bigaHyd:100},'bigaHyd');reject({...biga,ph:50},'ph');reject({...biga,share:10},'share');
});
test('direct dough ignores hidden preferment fields and has no preferment ingredients or stages',()=>{
 const r=calc({method:'direct',ph:'',pcold:999,share:'bad',preferTemp:999,bigaHyd:999,fridge:99999});
 assert.equal(r.errors.length,0);assert.equal(r.pf,0);assert.equal(r.pw,0);assert.equal(r.preferYeast,0);assert.equal(r.ff,r.flour);assert.equal(r.fw,r.water);assert.ok(r.finalYeast>0);
 assert.ok(!r.steps.some(s=>['prefer','preferCold'].includes(s.kind)));
});
test('final warm limits include mixing; cold balls require rewarming',()=>{
 assert.equal(calc({bulk:4,proof:5.5}).errors.length,0);reject({bulk:4,proof:6},'proof');reject({bulk:0,proof:1},'proof');
 reject({cold:24,proof:1},'proof');reject({cold:49},'cold');reject({cold:12,fridge:8},'fridge');
 assert.equal(calc({method:'direct',temp:18,bulk:15.5,proof:8}).errors.length,0);reject({method:'direct',temp:18,bulk:16,proof:8},'proof');
 reject({method:'direct',bulk:0,proof:1.5},'proof');assert.equal(calc({method:'direct',bulk:1,proof:1.5}).errors.length,0);
});
test('invalid and off-step numbers cannot produce recipes; old saved salt is still rejected',()=>{
 for(const ph of ['', ' ',NaN,Infinity,-1,0,'oops','12x',12.25,null,{}])reject({ph},'ph');
 reject({balls:0},'balls');reject({weight:252},'weight');reject({adjust:200},'adjust');reject({yeast:'dry'},'yeast');reject({saltkg:28},'saltkg');reject({saltkg:24,hyd:80},'saltkg');reject({method:'__proto__'},'method');
});
test('all methods conserve total mass, water and separate yeast doses across useful edge cases',()=>{
 for(const base of [{},{...coldPoolish},{...biga},{method:'direct'}])for(const balls of [1,4,12])for(const hyd of [55,65,80])for(const yeast of ['fresh','instant']){
  const r=calc({...base,balls,hyd,yeast});assert.equal(r.errors.length,0,JSON.stringify(r.errors));
  assert.ok(Math.abs(r.flour+r.water+r.salt+r.preferYeast+r.finalYeast-balls*250)<1e-8);
  assert.ok(Math.abs(r.pf+r.ff-r.flour)<1e-8);assert.ok(Math.abs(r.pw+r.fw-r.water)<1e-8);assert.ok(r.finalYeast>=0&&r.fw>=0);
 }
});
test('yeast planning responds to final temperature, duration and refrigeration',()=>{
 const fast=calc({method:'direct',bulk:1,proof:2});const slow=calc({method:'direct',bulk:2,proof:6});
 assert.ok(fast.finalYeast>slow.finalYeast);
 assert.ok(calc({method:'direct',temp:18}).finalYeast>calc({method:'direct',temp:25}).finalYeast);
 assert.ok(calc({method:'direct',cold:24}).finalYeast<calc({method:'direct',cold:0}).finalYeast);
 const prefFast=calc({bulk:0,proof:1.5});assert.ok(prefFast.finalYeast>calc({}).finalYeast);assert.ok(prefFast.preferYeast>0);
});
test('planner fits all successful plans into the window and never stretches preferments to fill spare time',()=>{
 const start=Date.parse('2026-10-23T10:00:00+02:00');
 for(const base of [{},{...coldPoolish},{...biga},{method:'direct'}])for(const hours of [2,3,6,10,14,18,19,24,36,48,72,100]){
  const p=R.plan({...R.defaults,...base},new Date(start),new Date(start+hours*3600000));
  if(p.error){if(hours>=36)assert.fail(p.error);continue;}
  assert.equal(p.result.errors.length,0);assert.ok(p.startsAt>=start-1);assert.ok(p.result.hours<=hours+1e-8);
  const timeline=R.timeline(p.result,new Date(p.endsAt));assert.equal(timeline[0].startsAt,p.startsAt);assert.equal(timeline.at(-1).kind,'bake');assert.equal(timeline.at(-1).startsAt,p.endsAt);
 }
 const p=R.plan({...R.defaults},new Date(start),new Date(start+100*3600000));assert.equal(p.settings.ph,12);assert.equal(p.settings.cold,24);
 assert.ok(R.plan(R.defaults,'','').error);
});

test('use windows provide stage-specific inspection margins, not one universal hour',()=>{
 const warm=R.useWindows(calc({}));assert.equal(warm.length,2);
 assert.deepEqual([warm[0].duration,warm[0].early,warm[0].late],[12,11,13]);
 const b=R.useWindows(calc(biga))[0];assert.equal(b.kind,'prefer');assert.equal(b.early,14);assert.equal(b.late,18);
 const hot=R.useWindows(calc({ph:8,preferTemp:28}))[0];assert.ok(hot.earlier<warm[0].earlier);assert.equal(hot.later,0);assert.equal(hot.clippedLate,true);
});
test('refrigerated preferment window uses the cold stage; direct dough only has balls',()=>{
 const cold=R.useWindows(calc(coldPoolish));assert.equal(cold[0].kind,'preferCold');assert.equal(cold[0].duration,24);assert.equal(cold[0].early,22);assert.equal(cold[0].late,24);
 const direct=R.useWindows(calc({method:'direct'}));assert.equal(direct.length,1);assert.equal(direct[0].kind,'proof');
 assert.deepEqual(R.useWindows(calc({ph:50})),[]);
});
test('windows are bounded by supported durations and total final warm time',()=>{
 for(const base of [{},{...coldPoolish},{...biga},{method:'direct'}])for(const temp of [16,21,28])for(const proof of [2,4,6]){
  const r=calc({...base,temp,proof});if(r.errors.length)continue;
  for(const w of R.useWindows(r)){assert.ok(w.early<=w.duration);assert.ok(w.late>=w.duration);assert.ok(w.early>=0);if(w.kind==='proof')assert.ok(.5+r.v.bulk+w.late<=R.finalMax(temp,r.v.method)+1e-8);}
 }
 const edge=R.useWindows(calc({bulk:4,proof:5.5})).find(w=>w.kind==='proof');assert.equal(edge.later,0);
});
test('inspection status includes boundaries and treats custom yeast correction as uncertain',()=>{
 const w=R.useWindows(calc({}))[0];assert.equal(R.useWindowStatus(w,11),'window');assert.equal(R.useWindowStatus(w,13),'window');assert.equal(R.useWindowStatus(w,10.75),'early');assert.equal(R.useWindowStatus(w,13.25),'late');
 const custom=R.useWindows(calc({adjust:125}))[0];assert.equal(custom.uncertain,true);assert.equal(R.useWindowStatus(custom,12),'uncertain');assert.equal(R.useWindowStatus(null,12),'unknown');
});
