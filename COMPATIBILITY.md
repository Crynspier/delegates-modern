# Compatibility with `delegates` 1.0.0

`delegates-modern` targets the public API and normal observable behavior of the original `delegates` package.

## Preserved behavior

- The default export is callable without `new`.
- `delegate(proto, target)` creates a chainable delegator.
- `.method(name)`, `.getter(name)`, `.setter(name)`, `.access(name)`, and `.fluent(name)` return the same delegator.
- Delegated methods call the target method with the target object as `this`.
- `fluent(name)` treats an `undefined` argument as a getter.
- Delegated descriptors are enumerable and configurable.
- Target exceptions propagate normally.
- `Delegator.auto(proto, targetProto, targetProp)` classifies own descriptors by getter, setter, data value, and writable state.

## Intentional improvements

- ESM and CommonJS.
- TypeScript declarations.
- String and symbol property keys.
- Standards-based `Object.defineProperty`.
- `delegate.auto(...)` is available on the default export.
- `Delegator.auto(...)` returns the created delegator.
- Writable function-valued properties discovered by `auto()` remain callable while assignment updates the delegated target.

## Scope

No proxies, decorators, runtime metadata, or framework integrations.
