import assert from 'node:assert/strict'
import { test } from 'node:test'
import delegate, { Delegator } from '../dist/index.js'

test('auto sees non-enumerable own properties',()=>{const t={};Object.defineProperty(t,'hidden',{value:7,enumerable:false,writable:false,configurable:true});const h={target:t};Delegator.auto(h,t,'target');assert.equal(h.hidden,7)})
test('auto ignores inherited properties',()=>{const p={inherited:1};const t=Object.create(p);t.own=2;const h={target:t};Delegator.auto(h,t,'target');assert.equal(h.own,2);assert.equal('inherited' in h,false)})
test('redefining configurable member works',()=>{const h={target:{value:2},value:1};delegate(h,'target').getter('value');assert.equal(h.value,2)})
test('non-configurable existing member fails',()=>{const h={target:{value:2}};Object.defineProperty(h,'value',{value:1,configurable:false});assert.throws(()=>delegate(h,'target').getter('value'),TypeError);assert.equal(h.value,1)})
test('target errors propagate',()=>{const e=Error('boom');const h={target:{get value(){throw e}}};delegate(h,'target').getter('value');assert.throws(()=>h.value,x=>x===e)})
test('method errors propagate',()=>{const e=Error('boom');const h={target:{run(){throw e}}};delegate(h,'target').method('run');assert.throws(()=>h.run(),x=>x===e)})
test('setter errors propagate',()=>{const e=Error('boom');const h={target:{set value(_){throw e}}};delegate(h,'target').setter('value');assert.throws(()=>{h.value=1},x=>x===e)})
test('fluent setter returns host',()=>{const h={target:{value:1}};delegate(h,'target').fluent('value');assert.equal(h.value(2),h);assert.equal(h.target.value,2)})
test('multiple delegators coexist',()=>{const h={a:{value:1},b:{value:2}};delegate(h,'a').getter('aValue');delegate(h,'b').getter('bValue');assert.equal(h.aValue,1);assert.equal(h.bValue,2)})
test('auto handles symbols',()=>{const k=Symbol('x');const t={[k]:42};const h={target:t};Delegator.auto(h,t,'target');assert.equal(h[k],42)})
test('method supports symbols',()=>{const k=Symbol('m');const t={[k](v){return this.value+v},value:4};const h={target:t};delegate(h,'target').method(k);assert.equal(h[k](3),7)})
test('writable function auto preserves call+assignment',()=>{const t={fn(){return 1}};const h={target:t};Delegator.auto(h,t,'target');assert.equal(typeof h.fn,'function');assert.equal(h.fn(),1);t.fn=()=>2;assert.equal(h.fn(),2);const repl=()=>3;h.fn=repl;assert.equal(t.fn,repl)})
