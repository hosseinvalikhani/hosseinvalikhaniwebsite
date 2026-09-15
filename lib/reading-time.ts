/**
 * Reading time, injected into a post's frontmatter at build time.
 *
 * Nuxt Content has no built-in support for this, and counting words on the client would mean
 * shipping every post's body to the listing page just to count it.
 *
 * It lives here rather than inline in nuxt.config so it can be tested. The line-ending bug below
 * is exactly the kind that a config-file closure hides: it fails silently, leaving `readingTime`
 * undefined on every post, and nothing in the build reports it.
 */

/** Words per minute. The usual figure for prose read on screen. */
export const WPM = 200

/** The opening fence of a frontmatter block, tolerating a Windows line ending. */
const OPENING = /^---\r?\n/

export function countWords(body: string): number {
  return body.split(/\s+/).filter(Boolean).length
}

export function readingTimeMinutes(body: string): number {
  return Math.max(1, Math.ceil(countWords(body) / WPM))
}

/** The text between the opening fence and the closing one, or '' when there is no block. */
function frontmatterBlock(body: string): string {
  if (!OPENING.test(body)) return ''
  const afterOpening = body.replace(OPENING, '')
  const closing = afterOpening.search(/^---\r?$/m)
  return closing === -1 ? afterOpening : afterOpening.slice(0, closing)
}

/**
 * Insert `readingTime` immediately after the opening `---` of the frontmatter block.
 *
 * The line ending has to be tolerated rather than assumed: authoring happens on Windows, so a
 * `\r\n` after the opening `---` is normal, and a `/^---\n/` pattern silently matches nothing.
 * Returns the body unchanged when there is no frontmatter to add to.
 *
 * The key is never written twice. Two reasons that matters: a duplicate `readingTime:` in one
 * YAML block is ambiguous — which of the two wins is a parser detail rather than something the
 * author chose — and an author who sets it by hand has made a decision about their own post.
 * Overwriting that would be the build overruling them silently.
 */
export function withReadingTime(body: string): string {
  if (!OPENING.test(body)) return body
  if (/^readingTime:/m.test(frontmatterBlock(body))) return body

  return body.replace(OPENING, match => `${match}readingTime: ${readingTimeMinutes(body)}\n`)
}
