/**
 * Serves `.output/public` the way a static host would.
 *
 * Every check that matters in Phases 13–15 runs against the built output rather than the dev
 * server, and the two differ in ways that change the result: `features.noScripts` is production
 * only, and the precompressed `.br` / `.gz` files Nitro emits only exist after a build.
 *
 * Serving those precompressed files is not a nicety. Measuring uncompressed transfer under
 * Lighthouse's throttling inflated LCP from 1.5s to 2.0s and made the site look like it was
 * failing its budget — the rig was wrong, not the site.
 *
 * The site is served from a base path: GitHub Pages puts a project repository under
 * /<repo>/, and every link in the built HTML is prefixed to match. A request that arrives
 * without the prefix is redirected onto it rather than served from the root.
 *
 * The redirect is what makes the e2e suite honest. Serving both shapes silently would let
 * a test sit at / while the page it loaded links to /<repo>/..., which turns every in-page
 * anchor into a cross-document navigation - the drawer test caught exactly that, and the
 * failure looked like a broken dialog rather than a mismatched URL. Redirecting means the
 * browser ends up where a real visitor would, so relative and same-document behaviour
 * matches production.
 *
 * Usage: node scripts/serve-output.mjs [dir] [port] [base]
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import process from 'node:process'

const ROOT = process.argv[2] || '.output/public'
const PORT = Number(process.argv[3] || process.env.PORT || 3000)
const BASE = (process.argv[4] || process.env.BASE_PATH || '/hosseinvalikhaniwebsite/').replace(/\/*$/, '/')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const isFile = async (path) => {
  try { return (await stat(path)).isFile() }
  catch { return false }
}

async function send(res, file, accept, status = 200) {
  const headers = {
    'content-type': TYPES[extname(file)] || 'application/octet-stream',
    'cache-control': 'no-store',
    'vary': 'accept-encoding',
  }

  for (const [ext, encoding] of [['.br', 'br'], ['.gz', 'gzip']]) {
    if (!accept.includes(encoding) || !(await isFile(file + ext))) continue
    res.writeHead(status, { ...headers, 'content-encoding': encoding })
    res.end(await readFile(file + ext))
    return
  }

  res.writeHead(status, headers)
  res.end(await readFile(file))
}

createServer(async (req, res) => {
  const accept = req.headers['accept-encoding'] || ''
  const requested = decodeURIComponent((req.url || '/').split('?')[0])

  // Send bare paths to their prefixed home so the browser's address bar matches production;
  // everything after this point can then assume the prefix is present.
  if (BASE !== '/' && !requested.startsWith(BASE)) {
    const to = BASE + requested.replace(/^\//, '')
    res.writeHead(302, { location: to }).end()
    return
  }

  // .output/public *is* the base, so the prefix comes off before resolving a file.
  const url = requested.startsWith(BASE) ? `/${requested.slice(BASE.length)}` : requested

  // Directory index and extensionless routes, the way a static host resolves them.
  for (const candidate of [join(ROOT, url), join(ROOT, url, 'index.html'), join(ROOT, `${url}.html`)]) {
    if (!(await isFile(candidate))) continue
    await send(res, candidate, accept)
    return
  }

  // A real 404 status, not a 200 with "not found" on it — the soft-404 the plan warns about.
  const notFound = join(ROOT, '404.html')
  if (await isFile(notFound)) {
    await send(res, notFound, accept, 404)
    return
  }

  res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
}).listen(PORT, () => {
  console.log(`serving ${ROOT} on http://localhost:${PORT}${BASE} (bare paths resolve too)`)
})
