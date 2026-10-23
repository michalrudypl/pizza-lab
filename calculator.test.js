'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('./calculator');
const calc=s=>R.calculate({...R.defaults,...s});
const base=method=>R.referenceSettings(method);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const valid=s=>{const r=R.calculate(s);assert.deepEqual(r.errors,[]);return r;};
const reject=(s,field)=>assert.ok(calc(s).errors.some(e=>e.field===field),JSON.stringify(s));
test('source recipes preserve published fresh-yeast, salt and water ratios',()=>{
 for(const [method,hyd,salt,prefer,final] of [['poolish',.63,.03,5/1000,0],['biga',.7,.028,7/1000,0],['direct',.6,.03,0,2/1000]]){
  const r=valid(base(method));near(r.water/r.flour,hyd);near(r.salt/r.flour,salt);near(r.preferYeast/(r.pf||1),prefer);near(r.finalYeast/r.flour,final);assert.equal(r.reference.adapted,false);
 }
});
test('mass and flour/water balance survive scaling, yeast types and manual doses',()=>{
 for(const method of ['poolish','biga','direct'])for(const balls of [1,4,12])for(const weight of [150,250,500])for(const yeast of ['fresh','instant'])for(const yeastMode of ['reference','manual']){
  const r=valid({...base(method),balls,weight,yeast,yeastMode});near(r.flour+r.water+r.salt+r.yeast,balls*weight);near(r.pf+r.ff,r.flour);near(r.pw+r.fw,r.water);assert.ok(r.fw>=0&&r.ff>=0&&r.finalYeast>=0);
 }
 near(valid(base('biga')).ff,0);near(valid(base('poolish')).fw/valid(base('poolish')).flour,.33);
});
test('instant conversion follows the specific source or explicit manual convention',()=>{
 near(valid({...base('direct'),yeast:'instant'}).finalPct,.1);
 near(valid({...base('biga'),yeast:'instant'}).preferPct,.7/3);
 near(valid({...base('direct'),yeast:'instant',yeastMode:'manual',finalDose:3}).finalPct,.1);
});
test('recipe changes never masquerade as source-calibrated predictions',()=>{
 const b=base('poolish');for(const update of [{temp:25},{preferTemp:25},{cold:24},{share:50},{saltkg:18},{hyd:75},{adjust:125},{yeastMode:'manual'}])assert.equal(valid({...b,...update}).reference.adapted,true);
 assert.equal(valid({...b,balls:8,weight:300}).reference.adapted,false);
 const before=valid(base('direct')),after=valid({...base('direct'),proof:12,temp:24,saltkg:15});near(before.finalPct,after.finalPct);assert.ok(after.warnings.some(w=>w.includes('Adaptacja')));
});
test('manual dose bases are preferment flour and total flour respectively',()=>{
 const r=valid({...base('poolish'),share:30,yeastMode:'manual',preferDose:2,finalDose:1});near(r.preferYeast/r.pf,.002);near(r.finalYeast/r.flour,.001);
 const doubled=valid({...r.v,adjust:150});near(doubled.preferPct,r.preferPct*1.5);near(doubled.finalPct,r.finalPct*1.5);
 reject({yeastMode:'manual',preferDose:0,finalDose:1},'preferDose');reject({method:'direct',yeastMode:'manual',finalDose:0},'finalDose');
});
test('invalid fields cannot yield a usable recipe and inactive fields are ignored',()=>{
 for(const ph of ['', ' ',NaN,Infinity,-1,0,'oops','12x',12.25,null,{}])reject({ph},'ph');
 for(const value of ['',NaN,Infinity,-1,31])reject({yeastMode:'manual',preferDose:value},'preferDose');
 reject({method:'__proto__'},'method');assert.equal(R.referenceStatus({method:'__proto__'}),null);assert.equal(R.referenceSettings('__proto__'),null);
 reject({yeastMode:'other'},'yeastMode');reject({coldPosition:'other'},'coldPosition');reject({saltkg:28},'saltkg');reject({hyd:80,saltkg:24},'saltkg');reject({share:70,hyd:65},'share');reject({checkBefore:0},'checkBefore');reject({mixHours:0},'mixHours');
 valid({...base('direct'),share:'bad',ph:'',preferTemp:999,pcold:999,bigaHyd:999,fridge:999,preferDose:'bad',yeastMode:'manual'});
});
test('scope bounds do not jump at arbitrary temperature bands',()=>{
 for(const t of [20,21,23,24,26,27]){assert.equal(R.poolishMax(t),24);valid({...R.defaults,preferTemp:t,ph:20});}
 reject({ph:50},'ph');reject({...base('poolish'),preferMode:'cold',ph:1,pcold:50},'pcold');reject({...base('biga'),ph:50},'ph');reject({...base('biga'),preferTemp:24},'preferTemp');reject({cold:49},'cold');
 valid({...base('direct'),cold:24,proof:1});assert.ok(valid({...base('direct'),cold:24,proof:1}).warnings.some(w=>w.includes('Krótki czas')));
});
test('poolish source uses one yeast dose, 30% prefermented flour, and 63% water',()=>{
 const r=valid(base('poolish'));near(r.pf/r.flour,.3);near(r.preferYeast/r.flour,.0015);near(r.finalYeast,0);
 near(r.salt/r.flour,.03);near(r.water/r.flour,.63);near(r.hours,23);
 assert.equal(r.steps.find(s=>s.kind==='mix').instruction.includes('dodatkową porcją drożdży'),false);
 assert.equal(r.reference.adapted,false);
});
test('cold placement changes step order, with an optional pre-fridge ball rest',()=>{
 const bulk=valid({...base('poolish'),cold:24,coldPosition:'bulk'}).steps.map(s=>s.kind);
 assert.ok(bulk.indexOf('cold')<bulk.indexOf('shape'));
 const balls=valid({...base('poolish'),cold:24,coldPosition:'balls',preColdProof:1.5,proof:2.5});
 const kinds=balls.steps.map(s=>s.kind);assert.ok(kinds.indexOf('cold')>kinds.indexOf('shape'));
 assert.ok(kinds.indexOf('preColdProof')>kinds.indexOf('shape')&&kinds.indexOf('preColdProof')<kinds.indexOf('cold'));
 near(balls.hours,42);near(balls.steps.find(s=>s.kind==='cold').hours,24);
 near(valid({...base('poolish'),preColdProof:5}).hours,23);
});
test('proof and bake steps carry the poke test and the AVPN stone-temperature reference',()=>{
 for(const method of ['poolish','biga','direct']){
  const steps=valid(base(method)).steps;
  assert.ok(steps.find(s=>s.kind==='proof').instruction.includes('wgłębienie'));
  const bake=steps.find(s=>s.kind==='bake').instruction;assert.ok(bake.includes('380–430°C')&&bake.includes('60–90 s'));
 }
});
test('planner preserves doses, phases and extra spare time instead of filling it',()=>{
 const start=Date.parse('2026-10-23T10:00:00+02:00');
 for(const method of ['poolish','biga','direct'])for(const hours of [2,8,12,24,36,100]){
  const s=base(method),r=valid(s),p=R.plan(s,new Date(start),new Date(start+hours*3600000));
  if(hours<r.hours){assert.ok(p.error);continue;}
  assert.ok(!p.error);assert.deepEqual(p.settings,s);near(p.result.hours,r.hours);near(p.result.yeast,r.yeast);assert.ok(p.startsAt>=start);
  const timeline=R.timeline(p.result,new Date(p.endsAt));near(timeline[0].startsAt,p.startsAt);near(timeline.at(-1).startsAt,p.endsAt);
 }
 assert.ok(R.plan(R.defaults,'','').error);
});
test('DDT handles straight and prefermented dough in Celsius with invalid-input rejection',()=>{
 near(R.waterTemperature({target:24,room:21,flour:22,friction:3}),26);
 near(R.waterTemperature({target:24,room:21,flour:22,friction:3,preferment:18}),32);
 assert.equal(R.waterTemperature({target:'',room:21,flour:22,friction:3}),null);
 assert.equal(R.waterTemperature({target:24,room:21,flour:22,friction:-3}),null);
 assert.equal(R.waterTemperature({target:24,room:21,flour:22,friction:3,preferment:NaN}),null);
});
test('dough temperature and flour are optional but validated and produce actionable cautions',()=>{
 valid({...base('biga'),doughTemp:'',flourW:''});reject({doughTemp:'oops'},'doughTemp');reject({flourW:'oops'},'flourW');
 assert.ok(valid({...base('biga'),flourW:260}).warnings.some(w=>w.includes('słabsza')));
 assert.ok(valid({...base('direct'),doughTemp:26}).warnings.some(w=>w.includes('różne temperatury')));
});
test('legacy saved recipes keep their doses as manual values, including instant',()=>{
 const old={...R.defaults,preferTemp:21,temp:21,ph:12,proof:4,bulk:1,flourW:''};for(const k of ['yeastMode','preferDose','finalDose','mixHours','coldPosition','checkBefore','checkAfter','doughTemp','flourW'])delete old[k];
 const migrated=R.migrateSettings(old);assert.equal(migrated.yeastMode,'manual');near(migrated.preferDose,2.5);near(migrated.finalDose,0);
 near(valid(migrated).preferPct,.25);near(valid(R.migrateSettings({...old,yeast:'instant'})).preferPct,.25/3);
 const direct=R.migrateSettings({...old,method:'direct'});near(valid(direct).finalPct,.2*Math.pow(7.5/5.5,1.15));
 assert.deepEqual(R.migrateSettings(migrated),migrated);assert.equal(R.migrateSettings(base('direct')).yeastMode,'reference');
});
test('inspection intervals are user schedules, independent of supposed yeast activity',()=>{
 const r=valid({...base('biga'),checkBefore:.5,checkAfter:2}),w=R.useWindows(r)[0];near(w.early,17.5);near(w.late,20);assert.equal(w.uncertain,true);
 const adjusted=R.useWindows(valid({...r.v,adjust:125}))[0];near(adjusted.early,w.early);near(adjusted.late,w.late);
 near(R.useWindows(valid({...base('direct'),proof:.5,checkBefore:3}))[0].early,0);
 assert.equal(R.useWindows(valid(base('poolish')))[0].kind,'prefer');assert.equal(R.useWindows(valid(base('direct'))).length,1);
 assert.deepEqual(R.useWindows(calc({ph:50})),[]);
 assert.equal(R.useWindowStatus(w,17.5),'window');assert.equal(R.useWindowStatus(w,20),'window');assert.equal(R.useWindowStatus(w,17),'early');assert.equal(R.useWindowStatus(w,21),'late');assert.equal(R.useWindowStatus(null,12),'unknown');
});
