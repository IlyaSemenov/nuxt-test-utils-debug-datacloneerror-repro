# Reproduction: `DataCloneError` in `@nuxt/test-utils` when `DEBUG` is set

`@nuxt/test-utils` fails to load its Vitest config with `DataCloneError: #<Object> could not be cloned`
when any non-empty `DEBUG` environment variable is present — even one unrelated to Nuxt.

## Setup

```sh
npm install
```

## Steps

```sh
npm test              # passes
DEBUG=1 npm test      # fails before any test runs
```

The second command fails with:

```
failed to load config from vitest.config.ts
DOMException [DataCloneError]: #<Object> could not be cloned.
    at getVitestConfigFromNuxt (node_modules/@nuxt/test-utils/dist/config.mjs:133:39)
```

Any value works (`DEBUG=1`, `DEBUG=release`, `DEBUG=app:*`), because `std-env` treats every
non-empty `DEBUG` as debug mode.

## Why

1. `std-env` sets `isDebug` from any non-empty `DEBUG` env var, and Nuxt resolves
   `debug` (and therefore `experimental.debugModuleMutation`) from it.
2. With `debugModuleMutation`, Nuxt wraps `nuxt.options` in an `on-change` proxy while modules run.
3. `modules/example-module.ts` does `nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {...})`
   — a widespread module pattern. `defu` copies the proxied nested objects into the new config,
   so the proxies outlive the module setup and stay inside `nuxt.options.runtimeConfig`.
4. `@nuxt/test-utils` then calls `structuredClone(options.nuxt.options.runtimeConfig)`
   (`src/config.ts`), and `structuredClone` throws `DataCloneError` on proxy objects.

Removing the module, or unsetting `DEBUG`, makes the tests pass.
