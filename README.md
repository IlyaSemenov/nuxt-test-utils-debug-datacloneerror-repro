# Reproduction: Nuxt debug proxy leaks into `nuxt.options` and breaks config consumers

When any non-empty `DEBUG` environment variable is present — even one unrelated to Nuxt —
the `on-change` proxy installed by `experimental.debugModuleMutation` survives module setup
and stays inside `nuxt.options.runtimeConfig`.

Anything that later treats `nuxt.options` as a plain object then breaks. This repository shows
two views of the same bug: the leak itself (Nuxt), and one of its victims (`@nuxt/test-utils`).

## Setup

```sh
npm install
```

## 1. The leak (no Vitest involved)

```sh
npm run check:proxy-leak              # clean
DEBUG=1 npm run check:proxy-leak      # proxy leaked, structuredClone fails
```

With `DEBUG=1` it prints:

```
debug: true
experimental.debugModuleMutation: true
nuxt.options is proxy: false
nuxt.options.runtimeConfig is proxy: false
proxied runtimeConfig keys: public, app, nitro
structuredClone(runtimeConfig): FAILED — DataCloneError: #<Object> could not be cloned.
```

Note that `nuxt.options` itself is no longer a proxy — the proxy is *inside* it, embedded in the
config that modules produced during setup.

## 2. One of the victims: `@nuxt/test-utils`

```sh
npm test              # passes
DEBUG=1 npm test      # fails before any test runs
```

```
failed to load config from vitest.config.ts
DOMException [DataCloneError]: #<Object> could not be cloned.
    at getVitestConfigFromNuxt (node_modules/@nuxt/test-utils/dist/config.mjs:133:39)
```

`@nuxt/test-utils` does `structuredClone(options.nuxt.options.runtimeConfig)` in `src/config.ts`,
and `structuredClone` throws `DataCloneError` on any Proxy object.

## Why it happens

1. `std-env` derives `isDebug` from *any* non-empty `DEBUG` env var (`DEBUG=1`, `DEBUG=release`,
   `DEBUG=app:*`), and Nuxt resolves `debug` — and therefore `experimental.debugModuleMutation` —
   from it.
2. With `debugModuleMutation`, Nuxt wraps `nuxt.options` in an `on-change` proxy while modules run.
3. [`modules/example-module.ts`](./modules/example-module.ts) merges its defaults into the config —
   a widespread module pattern:

   ```ts
   nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, { exampleModule: { apiKey: "" } })
   ```

   `defu` copies the *proxied* nested objects into the new object, so the proxies outlive module
   setup and remain in `nuxt.options.runtimeConfig`.
4. Any consumer that clones, serialises or otherwise inspects those objects breaks.

Removing the module, or unsetting `DEBUG`, makes both commands pass.

## Same class of problem, reported before

- https://github.com/nuxt/nuxt/issues/31553 — `on-change` proxy breaking `nuxt-swiper` and
  `vite-plugin-commonjs`; closed as `not planned` for lack of a reproduction.
