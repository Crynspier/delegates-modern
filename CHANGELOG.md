# Changelog

## Unreleased

### Compatibility

- Added a differential test suite against the actual `delegates@1.0.0` reference package.
- Restored legacy-compatible runtime property-key coercion instead of rejecting JavaScript values before property access.
- Restored legacy-compatible `[[Set]]` behavior for `.method()` and `.fluent()`, including inherited setters and non-writable properties.
- Preserved legacy observable bookkeeping by recording delegated names before property definition/assignment attempts.
- Restored TypeScript support for constructible `delegate(...)` calls and numeric property keys via the standard `PropertyKey` type.
- Aligned the factory prototype with `Delegator.prototype` so `instanceof delegate` remains compatible with the original constructor-style API.
- Documented that `Delegator.auto()` is an additive API not present in the published `delegates@1.0.0` package, plus the remaining module-shape and Node.js support differences.

### Build and packaging

- Replaced the hand-maintained CommonJS implementation with a generated CommonJS build from the TypeScript source.
- Added cross-platform Windows/Linux CI coverage for Node 18, 20, 22, 24, and 26.
- Made test and coverage commands invoke explicit test files instead of relying on shell glob expansion.
- Kept `delegates@1.0.0` as a development-only differential-test dependency; it is not a runtime dependency.

## 0.1.0 - 2026-09-20

Initial public-release candidate.

### Added

- Legacy-compatible delegation API.
- ESM and CommonJS packages.
- First-party TypeScript declarations.
- Symbol property support.
- Modern `Object.defineProperty` implementation.
- `Delegator.auto()` support with descriptor inspection.
- Compatibility and edge-case test suite.
- Type-level tests and benchmarks.
- Node 18/20/22/24/26 CI configuration.
