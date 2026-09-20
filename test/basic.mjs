import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import delegate, { Delegator } from '../dist/index.js'

test('method delegates arguments and target this', () => {
  const obj = { request: { value: 4, add(x, y) { assert.equal(this, obj.request); return this.value+x+y } } }
  const d = delegate(obj, 'request').method('add')
  assert.equal(obj.add(2, 3), 9)
  assert.deepEqual(d.methods, ['add'])
})
test('getter delegates reads', () => {
  const obj={request:{type:'text/html'}}; delegate(obj,'request').getter('type'); assert.equal(obj.type,'text/html')
})
test('setter delegates writes', () => {
  const obj={request:{_type:'old',set type(v){this._type=v},get type(){return this._type.toUpperCase()}}}; delegate(obj,'request').setter('type'); obj.type='hey'; assert.equal(obj.request.type,'HEY')
})
test('access delegates reads and writes', () => {
  const obj={request:{_type:'old',get type(){return this._type.toUpperCase()},set type(v){this._type=v}}}; delegate(obj,'request').access('type'); obj.type='hey'; assert.equal(obj.type,'HEY')
})
test('fluent preserves undefined-as-getter semantics', () => {
  const obj={settings:{env:'development'}}; delegate(obj,'settings').fluent('env'); assert.equal(obj.env(),'development'); assert.equal(obj.env(undefined),'development'); assert.equal(obj.env('production'),obj); assert.equal(obj.settings.env,'production')
})
test('default delegate is callable without new', () => { const obj={}; assert.ok(delegate(obj,'request') instanceof Delegator) })
test('static auto delegates descriptors', () => {
  const obj={settings:{env:'development',method(){return this.env}}}; let setterValue=0
  Object.defineProperty(obj.settings,'getter',{enumerable:true,configurable:true,get(){return this.env}})
  Object.defineProperty(obj.settings,'setter',{enumerable:true,configurable:true,set(v){setterValue=v}})
  Object.defineProperty(obj.settings,'constant',{enumerable:true,configurable:true,value:2,writable:false})
  Object.defineProperty(obj.settings,'mutable',{enumerable:true,configurable:true,value:3,writable:true})
  const d=Delegator.auto(obj,obj.settings,'settings'); assert.ok(d instanceof Delegator)
  assert.equal(obj.method(),'development'); assert.equal(obj.getter,'development'); obj.setter=10; assert.equal(setterValue,10); assert.equal(obj.constant,2); obj.mutable=9; assert.equal(obj.settings.mutable,9)
})
test('symbols work', () => { const s=Symbol('value'); const obj={target:{[s]:42}}; delegate(obj,'target').getter(s); assert.equal(obj[s],42) })
test('descriptors are enumerable/configurable',()=>{const obj={target:{value:42}};delegate(obj,'target').getter('value');const d=Object.getOwnPropertyDescriptor(obj,'value');assert.equal(d?.enumerable,true);assert.equal(d?.configurable,true)})
test('chaining returns same delegator',()=>{const obj={target:{a:1,b:2}};const d=delegate(obj,'target');assert.equal(d.method('toString').getter('a').setter('b').access('a').fluent('b'),d)})
test('runtime property keys retain legacy coercion',()=>{const obj={target:{'123':()=>123,null:'ok'}};const d=delegate(obj,'target');d.method(123).getter(null);assert.equal(obj['123'](),123);assert.equal(obj.null,'ok')})
test('delegate exposes auto and Delegator',()=>{assert.equal(delegate.auto,Delegator.auto);assert.equal(delegate.Delegator,Delegator);const host={target:{value:4}};const made=delegate.auto(host,host.target,'target');assert.ok(made instanceof Delegator);assert.equal(host.value,4)})
test('CJS exports callable delegate',()=>{const require=createRequire(import.meta.url);const cjs=require('../dist/index.cjs');assert.equal(typeof cjs,'function');assert.equal(cjs,cjs.default);assert.equal(cjs.delegate,cjs);assert.equal(cjs.auto,cjs.Delegator.auto);assert.equal(typeof cjs.Delegator,'function')})
