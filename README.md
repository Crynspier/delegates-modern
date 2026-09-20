# delegates-modern

[![CI](https://github.com/Crynspier/delegates-modern/actions/workflows/ci.yml/badge.svg)](https://github.com/Crynspier/delegates-modern/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/delegates-modern)](https://www.npmjs.com/package/delegates-modern)

**A tiny, dependency-free, TypeScript-first object and method delegation library for Node.js.**

A maintained modern implementation of the established [`delegates`](https://www.npmjs.com/package/delegates) API: delegate methods, getters, setters, accessors, fluent properties, and whole target prototypes onto a host object or prototype.

## Why this exists

`delegates` is a very small and useful primitive, but the published package has remained at **1.0.0 for more than a decade** and the runtime is still a legacy CommonJS implementation. It is nevertheless still widely installed and used by Node.js projects. The goal here is not to make a larger framework; it is to keep the same focused primitive while modernizing the implementation and distribution surface.

`delegates-modern` provides:

- the established `method()`, `getter()`, `setter()`, `access()`, `fluent()`, and `auto()` operations
- ESM and CommonJS
- first-party TypeScript declarations
- symbol property support
- standards-based `Object.defineProperty` descriptors
- explicit descriptor behavior and stronger validation
- zero runtime dependencies

## Install

```sh
npm install delegates-modern
```

## Basic usage

```js
import delegate from 'delegates-modern'

const context = {
  request: {
    path: '/users',
    accepts(type) {
      return `${type}:${this.path}`
    },
  },
}

delegate(context, 'request')
  .method('accepts')
  .getter('path')

context.path // '/users'
context.accepts('json') // 'json:/users'
```

## API

### `delegate(proto, target)`

Creates a `Delegator` that forwards members from `proto[target]`.

### `.method(name)`

Delegates a method. The target object is preserved as the method's `this` value.

### `.getter(name)`

Delegates property reads.

### `.setter(name)`

Delegates property writes.

### `.access(name)`

Creates both a getter and setter.

### `.fluent(name)`

Creates a method-like accessor. With no defined value it reads the target property; with a defined value it writes the target property and returns the host object for chaining. This preserves the established `delegates` behavior where `undefined` is treated as a read.

### `Delegator.auto(proto, targetProto, targetProp)`

Inspects the target prototype's own property descriptors and delegates its methods, getters, setters, and data properties automatically.

## TypeScript

The package ships its own declarations and generic host/target types:

```ts
interface Request {
  path: string
  accepts(type: string): boolean
}

interface Context {
  request: Request
}

delegate<Context, Request>(Context.prototype, 'request')
  .method('accepts')
  .getter('path')
```

## Compatibility

The public API and observable behavior of the original `delegates` package are the compatibility target. Modern improvements are additive where they do not needlessly change established semantics.

See [COMPATIBILITY.md](./COMPATIBILITY.md) for the exact compatibility surface and intentional improvements.

## Quality

- compatibility and edge-case tests
- symbol tests
- `auto()` descriptor classification tests
- CommonJS/ESM verification
- type-level tests
- benchmarks
- Node 18/20/22/24/26 CI
- zero runtime dependencies

```sh
npm install
npm run check
npm run coverage
npm run bench
npm run pack:check
```

## License

MIT
