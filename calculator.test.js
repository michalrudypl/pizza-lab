'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const rules = require('./calculator');
const calc = overrides => rules.calculate({...rules.defaults,...overrides});
const rejects = (overrides,field) => assert.ok(calc(overrides).errors.some(e=>e.field===field),JSON.stringify(overrides));

test('50-hour poolish is rejected at every supported temperature, even with cold final dough',()=>{
  for(let temp=16;temp<=28;temp++) rejects({ph:50,temp,cold:24},'ph');
});
test('temperature limits accept the boundary and reject the next half hour',()=>{
  for(const [temp,ph] of [[16,18],[20,18],[21,16],[23,16],[24,12],[26,12],[27,8],[28,8]]) {
    assert.equal(calc({temp,ph}).errors.length,0);
    rejects({temp,ph:ph+.5},'ph');
  }
});
test('final room time includes mixing, bulk and balls; refrigeration needs warm-up',()=>{
  assert.equal(calc({bulk:4,proof:5.5}).errors.length,0);
  rejects({bulk:4,proof:6},'proof');
  rejects({bulk:0,proof:1},'proof');
  rejects({bulk:1,cold:24,proof:1},'proof');
  assert.equal(calc({cold:24,proof:2}).errors.length,0);
  rejects({cold:49},'cold');
  rejects({cold:12,fridge:8},'fridge');
});
test('blank, nonfinite, malformed, out-of-range and off-step inputs cannot yield a recipe',()=>{
  for(const ph of ['', ' ', NaN, Infinity, -1, 0, 'oops', '12x', 12.25, null, undefined, {}]) rejects({ph},'ph');
  rejects({balls:0},'balls'); rejects({weight:252},'weight');
  rejects({adjust:200},'adjust'); rejects({yeast:'dry'},'yeast');
  rejects({saltkg:28},'saltkg'); rejects({saltkg:24,hyd:80},'saltkg');
});
test('default recipe and edge recipes conserve dough mass and 1:1 poolish hydration',()=>{
  for (const balls of [1,4,12]) for(const hyd of [55,65,80]) for(const share of [10,30,50]) for(const yeast of ['fresh','instant']) {
    const r=calc({balls,hyd,share,yeast});
    assert.equal(r.errors.length,0);
    assert.ok(Math.abs(r.flour+r.water+r.salt+r.yeast-balls*250)<1e-8);
    assert.equal(r.pf,r.pw);
    assert.ok(r.fw>=0 && r.ff>0 && r.yeast>0);
  }
  assert.equal(calc({}).warnings.length,0);
  assert.ok(calc({cold:48}).warnings.some(w=>w.includes('24 h TK')));
  assert.ok(calc({hyd:75}).warnings.some(w=>w.includes('70%')));
});
