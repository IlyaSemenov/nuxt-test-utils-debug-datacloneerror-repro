import { isProxy } from "node:util/types"
import { loadNuxt } from "nuxt/kit"

// Loads Nuxt exactly like any config consumer would — no Vitest, no @nuxt/test-utils involved —
// and reports whether the `debugModuleMutation` proxy survived module setup inside nuxt.options.

const nuxt = await loadNuxt({ cwd: process.cwd(), dev: false })
const runtimeConfig = nuxt.options.runtimeConfig

console.log("debug:", Boolean(nuxt.options.debug))
console.log("experimental.debugModuleMutation:", nuxt.options.experimental?.debugModuleMutation)
console.log("nuxt.options is proxy:", isProxy(nuxt.options))
console.log("nuxt.options.runtimeConfig is proxy:", isProxy(runtimeConfig))

const proxiedKeys = Object.entries(runtimeConfig)
  .filter(([, value]) => value && typeof value === "object" && isProxy(value))
  .map(([key]) => key)

console.log("proxied runtimeConfig keys:", proxiedKeys.length ? proxiedKeys.join(", ") : "(none)")

let failed = false
try {
  structuredClone(runtimeConfig)
  console.log("structuredClone(runtimeConfig): OK")
}
catch (error) {
  failed = true
  console.log(`structuredClone(runtimeConfig): FAILED — ${error.name}: ${error.message}`)
}

await nuxt.close()
process.exit(failed ? 1 : 0)
