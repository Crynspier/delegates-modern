import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import modern from '../dist/index.js'

const require = createRequire(import.meta.url)
const legacy = require('delegates')

function descriptorShape(object, key) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key)
  if (!descriptor) return null

  return {
    hasGet: typeof descriptor.get === 'function',
    hasSet: typeof descriptor.set === 'function',
    hasValue: Object.prototype.hasOwnProperty.call(descriptor, 'value'),
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
  }
}

function runCoreSurface(delegate) {
  const host = {
    target: {
      value: 4,
      count: 1,
      add(a, b) {
        assert.equal(this, host.target)
        return this.value + a + b
      },
      get countValue() {
        return this.count
      },
      set countValue(value) {
        this.count = value
      },
      fluentValue: 'initial',
    },
  }

  const delegator = delegate(host, 'target')

  const methodResult = delegator.method('add')
  const getterResult = delegator.getter('value')
  const setterResult = delegator.setter('countValue')
  const accessResult = delegator.access('value')
  const fluentResult = delegator.fluent('fluentValue')

  const callResult = host.add(2, 3)
  const valueBeforeWrite = host.value
  host.countValue = 8
  const countAfterWrite = host.countValue
  const fluentRead = host.fluentValue()
  const fluentWriteResult = host.fluentValue('changed')

  return {
    sameMethod: methodResult === delegator,
    sameGetter: getterResult === delegator,
    sameSetter: setterResult === delegator,
    sameAccess: accessResult === delegator,
    sameFluent: fluentResult === delegator,
    methods: delegator.methods.slice(),
    getters: delegator.getters.slice(),
    setters: delegator.setters.slice(),
    fluents: delegator.fluents.slice(),
    callResult,
    valueBeforeWrite,
    countAfterWrite,
    fluentRead,
    fluentWriteReturnsHost: fluentWriteResult === host,
    targetFluentValue: host.target.fluentValue,
    methodDescriptor: descriptorShape(host, 'add'),
    getterDescriptor: descriptorShape(host, 'value'),
    fluentDescriptor: descriptorShape(host, 'fluentValue'),
  }
}

test('differential: core delegation surface matches delegates@1.0.0', () => {
  assert.deepEqual(runCoreSurface(modern), runCoreSurface(legacy))
})

function runAccessorPreservation(delegate) {
  const host = {}
  let writes = 0

  Object.defineProperty(host, 'value', {
    get() {
      return 10
    },
    set(value) {
      writes = value
    },
    enumerable: false,
    configurable: true,
  })

  const target = {
    value: 20,
  }
  host.target = target

  const delegator = delegate(host, 'target')
  delegator.getter('value')

  const afterGetter = descriptorShape(host, 'value')
  host.value = 7
  const setterStillWorks = writes === 7

  delegator.setter('value')

  const afterSetter = descriptorShape(host, 'value')
  host.value = 9

  return {
    afterGetter,
    setterStillWorks,
    afterSetter,
    targetValue: host.target.value,
  }
}

test('differential: getter/setter descriptor preservation matches legacy behavior', () => {
  assert.deepEqual(runAccessorPreservation(modern), runAccessorPreservation(legacy))
})

function runAssignmentCompatibility(delegate) {
  const parent = {
    set inherited(value) {
      this.inheritedWrites = value
    },
  }

  const host = Object.create(parent)
  host.target = { value: 1 }
  const delegator = delegate(host, 'target')

  delegator.method('inherited')
  const inheritedSetterCalls = host.inheritedWrites ?? 0
  const ownMethodDescriptor = descriptorShape(host, 'inherited')

  const locked = Object.create(null)
  Object.defineProperty(locked, 'locked', {
    value: 'original',
    writable: false,
    enumerable: true,
    configurable: false,
  })
  const lockedDelegator = delegate(locked, 'target')
  let lockedError = null

  try {
    lockedDelegator.method('locked')
  } catch (error) {
    lockedError = error
  }

  return {
    inheritedSetterCalls,
    ownMethodDescriptor,
    lockedError: lockedError === null ? null : {
      name: lockedError.name,
      message: lockedError.message,
    },
    lockedValue: locked.locked,
    lockedMethods: lockedDelegator.methods.slice(),
  }
}

test('differential: method assignment semantics match legacy for inherited setters and locked properties', () => {
  assert.deepEqual(runAssignmentCompatibility(modern), runAssignmentCompatibility(legacy))
})

function runPropertyKeyCoercion(delegate) {
  const host = {
    target: {
      '123': function () {
        return 123
      },
      null: 'null-value',
    },
  }

  const delegator = delegate(host, 'target')
  delegator.method(123)
  delegator.getter(null)

  return {
    methodResult: host['123'](),
    getterResult: host.null,
    methods: delegator.methods.slice(),
    getters: delegator.getters.slice(),
  }
}

test('differential: JavaScript property-key coercion remains permissive at runtime', () => {
  assert.deepEqual(runPropertyKeyCoercion(modern), runPropertyKeyCoercion(legacy))
})

function runAutoCore(delegate) {
  const target = {}
  Object.defineProperty(target, 'method', {
    value() {
      return this.value
    },
    writable: false,
    enumerable: true,
    configurable: true,
  })
  Object.defineProperty(target, 'computed', {
    get() {
      return this.value
    },
    set(value) {
      this.value = value
    },
    enumerable: true,
    configurable: true,
  })
  Object.defineProperty(target, 'mutable', {
    value: 1,
    writable: true,
    enumerable: true,
    configurable: true,
  })
  Object.defineProperty(target, 'constant', {
    value: 2,
    writable: false,
    enumerable: true,
    configurable: true,
  })
  target.value = 10

  const host = { target }
  const result = delegate.auto(host, target, 'target')

  return {
    returnType: result === undefined ? 'undefined' : result.constructor.name,
    methodResult: host.method(),
    computedGet: host.computed,
    computedSet() {
      host.computed = 14
      return host.target.value
    },
    mutableGet: host.mutable,
    mutableAfterSet() {
      host.mutable = 11
      return host.target.mutable
    },
    constantGet: host.constant,
  }
}

test('differential: auto() matches legacy for ordinary descriptors apart from documented return value', () => {
  const modernResult = runAutoCore(modern)
  const legacyResult = runAutoCore(legacy)

  assert.equal(modernResult.returnType, 'delegator')
  assert.equal(legacyResult.returnType, 'undefined')
  assert.equal(modernResult.methodResult, legacyResult.methodResult)
  assert.equal(modernResult.computedGet, legacyResult.computedGet)
  assert.equal(modernResult.computedSet(), legacyResult.computedSet())
  assert.equal(modernResult.mutableGet, legacyResult.mutableGet)
  assert.equal(modernResult.mutableAfterSet(), legacyResult.mutableAfterSet())
  assert.equal(modernResult.constantGet, legacyResult.constantGet)
})

test('documented modern divergence: writable function properties remain callable in auto()', () => {
  function build(delegate) {
    const target = {
      value: 2,
      method() {
        return this.value
      },
    }
    const host = { target }

    Object.defineProperty(target, 'method', {
      value: target.method,
      writable: true,
      enumerable: true,
      configurable: true,
    })

    const result = delegate.auto(host, target, 'target')

    return {
      returnValue: result?.methods ? host.method() : undefined,
      descriptor: descriptorShape(host, 'method'),
      setterCount: result?.setters?.length ?? null,
    }
  }

  const legacyResult = build(legacy)
  const modernResult = build(modern)

  assert.equal(typeof legacyResult.returnValue, 'undefined')
  assert.equal(legacyResult.descriptor?.hasGet, false)
  assert.equal(legacyResult.descriptor?.hasSet, true)

  assert.equal(modernResult.returnValue, 2)
  assert.equal(modernResult.descriptor?.hasGet, true)
  assert.equal(modernResult.descriptor?.hasSet, true)
  assert.ok((modernResult.setterCount ?? 0) > (legacyResult.setterCount ?? 0))
})

test('documented modern additions: symbol keys and delegate.auto()', () => {
  const symbol = Symbol('value')
  const target = { [symbol]: 7 }
  const host = { target }

  assert.equal(typeof modern.auto, 'function')
  const result = modern.auto(host, target, 'target')
  assert.equal(result instanceof modern.Delegator, true)
  assert.equal(host[symbol], 7)
})

test('legacy compatibility contract: both factory and constructor forms remain usable', () => {
  const hostA = { target: {} }
  const hostB = { target: {} }

  const legacyDelegator = legacy(hostA, 'target')
  const modernDelegator = modern(hostB, 'target')

  const legacyConstructed = new legacy(hostA, 'target')
  const modernConstructed = new modern(hostB, 'target')

  assert.equal(legacyDelegator instanceof legacy, true)
  assert.equal(legacyConstructed instanceof legacy, true)

  assert.equal(modernDelegator instanceof modern.Delegator, true)
  assert.equal(modernConstructed instanceof modern.Delegator, true)
})
