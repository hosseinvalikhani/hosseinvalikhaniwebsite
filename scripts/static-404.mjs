/**
 * Replaces Nuxt's empty SPA fallback at 404.html with the prerendered /404 page.
 *
 * Static hosts serve 404.html for any unknown URL. Nuxt's default is a shell that renders the
 * error client-side, which means a blank page without JavaScript. Copying the prerendered
 * route over it makes the 404 readable on its own.
 *
 * Run after `nuxt generate`.
 */
import { copyFile, rm, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import process from 'node:process'

const DIST = '.output/public'
const SOURCE = `${DIST}/404/index.html`
const TARGET = `${DIST}/404.html`

if (!existsSync(SOURCE)) {
  console.error(`static-404: ${SOURCE} is missing — was /404 prerendered?`)
  process.exit(1)
}

await copyFile(SOURCE, TARGET)

// The precompressed copies now describe the old shell, so they must go or the host will serve
// stale bytes to every client that accepts gzip or brotli — which is all of them.
for (const stale of [`${TARGET}.gz`, `${TARGET}.br`]) {
  if (existsSync(stale)) await rm(stale)
}

const bytes = (await readFile(TARGET)).length
console.log(`static-404: wrote ${TARGET} from the prerendered route (${bytes} bytes)`)
