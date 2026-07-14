import { defineNuxtModule } from "@nuxt/kit"
import { defu } from "defu"

/**
 * A module that merges its defaults into runtimeConfig — a very common pattern.
 *
 * With `debugModuleMutation` enabled (which Nuxt turns on whenever a non-empty
 * `DEBUG` env var is present), `nuxt.options.runtimeConfig` is an `on-change`
 * proxy, so `defu()` copies proxied nested objects into the resulting config.
 * These proxies stay in `nuxt.options` after the module setup is over.
 */
export default defineNuxtModule({
  meta: { name: "example-module" },
  setup(_options, nuxt) {
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      exampleModule: { apiKey: "" },
    })
  },
})
