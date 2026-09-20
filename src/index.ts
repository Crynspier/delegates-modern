export type PropertyKeyLike = PropertyKey
export type AnyFunction = (...args: any[]) => any

type MethodKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends AnyFunction ? K : never
}[keyof T]

export class Delegator<
  Host extends object = object,
  Target extends object = Record<PropertyKeyLike, unknown>,
> {
  readonly proto: Host
  readonly target: PropertyKeyLike
  readonly methods: PropertyKeyLike[]
  readonly getters: PropertyKeyLike[]
  readonly setters: PropertyKeyLike[]
  readonly fluents: PropertyKeyLike[]

  constructor(proto: Host, target: PropertyKeyLike) {
    this.proto = proto
    this.target = target
    this.methods = []
    this.getters = []
    this.setters = []
    this.fluents = []
  }

  static auto<Host extends object, Target extends object>(
    proto: Host,
    targetProto: Target,
    targetProp: PropertyKeyLike,
  ): Delegator<Host, Target> {
    const delegator = new Delegator<Host, Target>(proto, targetProp)
    for (const property of Reflect.ownKeys(targetProto)) {
      const descriptor = Object.getOwnPropertyDescriptor(targetProto, property)
      if (!descriptor) continue

      if (typeof descriptor.get === 'function') delegator.getter(property)
      if (typeof descriptor.set === 'function') delegator.setter(property)

      if ('value' in descriptor) {
        if (typeof descriptor.value === 'function') {
          if (descriptor.writable) delegator.methodWithSetter(property)
          else delegator.method(property)
        } else if (descriptor.writable) {
          delegator.access(property)
        } else {
          delegator.getter(property)
        }
      }
    }
    return delegator
  }

  method<Name extends PropertyKeyLike = PropertyKeyLike>(name: Name): this {
    const target = this.target
    this.methods.push(name)

    Reflect.set(
      this.proto,
      name,
      function (this: Record<PropertyKeyLike, any>, ...args: any[]) {
        const delegated = this[target]
        return delegated[name].apply(delegated, args)
      },
      this.proto,
    )

    return this
  }

  private methodWithSetter<Name extends PropertyKeyLike = PropertyKeyLike>(name: Name): this {
    const target = this.target
    const wrapper = function (this: Record<PropertyKeyLike, any>, ...args: any[]) {
      const delegated = this[target]
      return delegated[name].apply(delegated, args)
    }

    defineProperty(this.proto, name, {
      get: function () { return wrapper },
      set: function (this: Record<PropertyKeyLike, any>, value: any) { this[target][name] = value },
      enumerable: true,
      configurable: true,
    })

    this.methods.push(name)
    this.setters.push(name)
    return this
  }

  access<Name extends PropertyKeyLike = PropertyKeyLike>(name: Name): this {
    return this.getter(name).setter(name)
  }

  getter<Name extends PropertyKeyLike = PropertyKeyLike>(name: Name): this {
    const target = this.target
    const current = getOwnDescriptor(this.proto, name)
    const descriptor: PropertyDescriptor = {
      get: function (this: Record<PropertyKeyLike, any>) { return this[target][name] },
      enumerable: true,
      configurable: true,
    }

    if (current?.set) descriptor.set = current.set

    this.getters.push(name)
    defineProperty(this.proto, name, descriptor)
    return this
  }

  setter<Name extends PropertyKeyLike = PropertyKeyLike>(name: Name): this {
    const target = this.target
    const current = getOwnDescriptor(this.proto, name)
    const descriptor: PropertyDescriptor = {
      set: function (this: Record<PropertyKeyLike, any>, value: any) { this[target][name] = value },
      enumerable: true,
      configurable: true,
    }

    if (current?.get) descriptor.get = current.get

    this.setters.push(name)
    defineProperty(this.proto, name, descriptor)
    return this
  }

  fluent<Name extends PropertyKeyLike = PropertyKeyLike>(name: Name): this {
    const target = this.target
    this.fluents.push(name)

    Reflect.set(
      this.proto,
      name,
      function (this: Record<PropertyKeyLike, any>, value?: any) {
        if (typeof value !== 'undefined') {
          this[target][name] = value
          return this
        }
        return this[target][name]
      },
      this.proto,
    )

    return this
  }
}

export type DelegatorFactory = {
  <
    Host extends object,
    Target extends object = Record<PropertyKeyLike, unknown>,
  >(proto: Host, target: PropertyKeyLike): Delegator<Host, Target>
  new <
    Host extends object,
    Target extends object = Record<PropertyKeyLike, unknown>,
  >(proto: Host, target: PropertyKeyLike): Delegator<Host, Target>
}

function createDelegator<Host extends object, Target extends object = Record<PropertyKeyLike, unknown>>(
  proto: Host,
  target: PropertyKeyLike,
): Delegator<Host, Target> {
  return new Delegator<Host, Target>(proto, target)
}

export interface DelegateFactory {
  <Host extends object, Target extends object = Record<PropertyKeyLike, unknown>>(
    proto: Host,
    target: PropertyKeyLike,
  ): Delegator<Host, Target>
  new <Host extends object, Target extends object = Record<PropertyKeyLike, unknown>>(
    proto: Host,
    target: PropertyKeyLike,
  ): Delegator<Host, Target>
  auto<Host extends object, Target extends object>(
    proto: Host,
    targetProto: Target,
    targetProp: PropertyKeyLike,
  ): Delegator<Host, Target>
  Delegator: typeof Delegator
}

export const delegate = Object.assign(createDelegator, {
  auto: Delegator.auto,
  Delegator,
}) as DelegateFactory

export default delegate

function getOwnDescriptor(target: object, key: PropertyKeyLike): PropertyDescriptor | undefined {
  return Object.getOwnPropertyDescriptor(target, key)
}

function defineProperty(target: object, key: PropertyKeyLike, descriptor: PropertyDescriptor): void {
  Object.defineProperty(target, key, descriptor)
}

export type DelegatedMethods<Target extends object, Names extends keyof Target> = {
  [Name in Names]: Target[Name] extends AnyFunction ? Target[Name] : never
}

export type DelegatedProperties<Target extends object, Names extends keyof Target> = {
  [Name in Names]: Target[Name]
}

export type DelegatedMethodName<Target extends object> = MethodKeys<Target>
