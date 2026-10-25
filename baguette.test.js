'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {calculateBag}=require('./baguette');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('fresh yeast adaptation: 950 flour, 730 water, 16 salt, 6 fresh yeast',()=>{
 const r=calculateBag({count:4,weight:1702/4,fold:false,proofMinutes:0,steam:false});
 assert.deepEqual(r.errors,[]);close(r.flour,950);close(r.water,730);close(r.salt,16);close(r.yeast,6);
});
test('ingredient mass remains equal to count times weight',()=>{
 for(const count of [1,2,8,20]){
  const r=calculateBag({count,weight:200});
  assert.deepEqual(r.errors,[]);close(r.flour+r.water+r.salt+r.yeast,count*200);
 }
});
test('fresh yeast input is expressed in g per kg flour',()=>{
 const r=calculateBag({yeastFreshPerKgFlour:8});
 close(r.yeast/r.flour,0.008);
});
test('fold happens during bulk; final proof shifts bake time',()=>{
 const a=calculateBag({bulkHours:9,fold:true,proofMinutes:0});
 const b=calculateBag({bulkHours:9,fold:true,proofMinutes:40});
 close(a.steps.find(x=>x.title==='Jedno złożenie').at,20);
 close(b.bakeOffset-a.bakeOffset,40);
});
test('datetime input anchors bake moment, not completion',()=>{
 const r=calculateBag({bakeAt:'2026-11-01T15:00'});
 close(r.startAt.getTime()+r.bakeOffset*60000,new Date('2026-11-01T15:00').getTime());
});
test('invalid inputs rejected',()=>{
 for(const patch of [{count:0},{count:1.4},{weight:''},{hydration:100},{yeastFreshPerKgFlour:100},{bakeAt:'broken'}]){
  assert.ok(calculateBag(patch).errors.length,JSON.stringify(patch));
 }
});
