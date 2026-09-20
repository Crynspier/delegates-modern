# Compatibility with `delegates` 1.0.0

`delegates-modern` is tested against the actual `delegates@1.0.0` package, not only against its README. The differential suite covers the established callback/factory API and the observable descriptor behavior that ordinary consumers can encounter.

## Compatibility target

The following core operations are intended to match `delegates@1.0.0`:

- callable factory form: `delegate(proto, target)`
- constructor form
- `.method(name)`
- `.getter(name)`
- `.setter(name)`
- `.access(name)`
- `.fluent(name)`
- tracking arrays: `methods`, `getters`, `setters`, and `fluents`
- target-method `this` binding
- getter/setter preservation when adding the other accessor half
- legacy JavaScript property-key coercion at runtime
- assignment semantics for `.method()` and `.fluent()`, including inherited setters and non-writable properties where JavaScript assignment is observable

TypeScript callers use the standard `PropertyKey` type (`string | number | symbol`). JavaScript callers also retain normal property-key coercion, including values such as `null` and `undefined` when used from plain JavaScript.

## Intentional modern differences

These differences are deliberate and are tested separately from the compatibility suite.

### 1. `Delegator.auto()` returns the created delegator

Original `delegates@1.0.0` does not explicitly return from `Delegator.auto()`, so its result is `undefined`.

`delegates-modern` returns the created `Delegator` instance. This supports useful chaining/introspection without changing the delegated properties themselves.

### 2. Writable function properties in `auto()`

The original implementation classifies a writable function as a method and then adds a setter, leaving a setter-style property.

`delegates-modern` treats a writable function as a callable delegated property with a getter returning the wrapper and a setter updating the target. This preserves both calling and assignment behavior.

### 3. Symbols are included by `auto()`

The original `auto()` uses `Object.getOwnPropertyNames()`, so symbol keys are not discovered automatically.

`delegates-modern` uses `Reflect.ownKeys()`, so symbol properties are included.

Manual symbol delegation is also supported.

### 4. Modern module packaging

The original package exports the `Delegator` constructor directly from CommonJS.

`delegates-modern` provides ESM and CommonJS entry points with a callable default/factory export plus a named `Delegator` class. The modern package therefore does not promise constructor identity compatibility with the original module export.

### 5. Node runtime floor

`delegates-modern` declares Node.js `>=18`. Consumers supporting older Node releases cannot treat it as a transparent replacement without an additional compatibility decision.

## Descriptor semantics

The implementation uses standards-based descriptor APIs for getters/setters and legacy-equivalent assignment semantics for method/fluent installation.

Delegated getter/setter descriptors are enumerable and configurable, matching the observable descriptors created by the legacy APIs in ordinary cases.

Exact behavior can still differ for unusual proxies, exotic host objects, or other metaprogramming constructs that intercept `[[Set]]`/property definition operations.

## Differential testing

The repository includes `test/differential.mjs`, which executes the same scenarios against:

- the installed `delegates@1.0.0` reference implementation
- `delegates-modern`

The suite is used to catch accidental compatibility regressions while keeping intentional modern differences explicit.

The original `delegates@1.0.0` package is a test-only development dependency; it is not a runtime dependency of the published package.


### 6. Function detection in `auto()`

The original implementation uses `value instanceof Function` when classifying function-valued descriptors. `delegates-modern` uses `typeof value === 'function'`, which is generally more robust for functions originating from another JavaScript realm. This is an intentional runtime-detection difference.

### 7. TypeScript cannot fully model `auto())

`auto()` inspects runtime property descriptors, including getters, setters, writable data properties, functions, and symbols. The generic TypeScript API cannot completely express every property transformation produced by that runtime inspection. The package therefore does not claim that automatic delegation is fully statically inferred.

## Packaging notes

The package declares `sideEffects: false` because importing the module performs no prototype or object mutations. All mutations happen only when a caller invokes the delegation API.
