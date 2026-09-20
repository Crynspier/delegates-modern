'use strict'

class Delegator {
  constructor(proto, target) {
    validateHost(proto)
    validatePropertyKey(target)
    this.proto = proto
    this.target = target
    this.methods = []
    this.getters = []
    this.setters = []
    this.fluents = []
  }
  static auto(proto, targetProto, targetProp) {
    const delegator = new Delegator(proto, targetProp)
    for (const property of Reflect.ownKeys(targetProto)) {
      const descriptor = Object.getOwnPropertyDescriptor(targetProto, property)
      if (!descriptor) continue
      if (typeof descriptor.get === 'function') delegator.getter(property)
      if (typeof descriptor.set === 'function') delegator.setter(property)
      if ('value' in descriptor) {
        if (typeof descriptor.value === 'function') {
          if (descriptor.writable) delegator.methodWithSetter(property)
          else delegator.method(property)
        } else if (descriptor.writable) delegator.access(property)
        else delegator.getter(property)
      }
    }
    return delegator
  }
  methodWithSetter(name) {
    validatePropertyKey(name)
    const target = this.target
    const wrapper = function (...args) {
      const delegated = this[target]
      return delegated[name].apply(delegated, args)
    }
    Object.defineProperty(this.proto, name, { get: function () { return wrapper }, set: function (value) { this[target][name] = value }, enumerable: true, configurable: true })
    this.methods.push(name); this.setters.push(name); return this
  }
  method(name) {
    validatePropertyKey(name)
    const target = this.target
    Object.defineProperty(this.proto, name, { value: function (...args) { const delegated = this[target]; return delegated[name].apply(delegated, args) }, writable: true, enumerable: true, configurable: true })
    this.methods.push(name); return this
  }
  access(name) { return this.getter(name).setter(name) }
  getter(name) {
    validatePropertyKey(name)
    const target = this.target
    const current = Object.getOwnPropertyDescriptor(this.proto, name)
    Object.defineProperty(this.proto, name, { get: function () { return this[target][name] }, set: current?.set, enumerable: true, configurable: true })
    this.getters.push(name); return this
  }
  setter(name) {
    validatePropertyKey(name)
    const target = this.target
    const current = Object.getOwnPropertyDescriptor(this.proto, name)
    Object.defineProperty(this.proto, name, { get: current?.get, set: function (value) { this[target][name] = value }, enumerable: true, configurable: true })
    this.setters.push(name); return this
  }
  fluent(name) {
    validatePropertyKey(name)
    const target = this.target
    Object.defineProperty(this.proto, name, { value: function (value) { if (typeof value !== 'undefined') { this[target][name] = value; return this } return this[target][name] }, writable: true, enumerable: true, configurable: true })
    this.fluents.push(name); return this
  }
}
function validateHost(proto) { if ((typeof proto !== 'object' || proto === null) && typeof proto !== 'function') throw new TypeError('proto must be an object or function') }
function validatePropertyKey(key) { if (typeof key !== 'string' && typeof key !== 'symbol') throw new TypeError('property names must be strings or symbols') }
function delegate(proto, target) { return new Delegator(proto, target) }
Object.assign(delegate, { default: delegate, Delegator })
module.exports = delegate
