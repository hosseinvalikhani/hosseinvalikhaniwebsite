import { describe, expect, it } from 'vitest'
import { tagPath, tagSlug } from '../../app/utils/tags'

/**
 * These two functions are the only mapping between an authored tag and its URL, and three
 * separate things depend on them agreeing exactly: the links on cards and posts, the route the
 * prerenderer discovers by crawling those links, and the lookup on the tag page that resolves a
 * slug back to its posts. A disagreement does not fail loudly — it produces a link that 404s, or
 * a prerendered page nothing points at.
 */
describe('tagSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(tagSlug('Design Systems')).toBe('design-systems')
  })

  it('collapses runs of punctuation into a single hyphen', () => {
    expect(tagSlug('CI / CD')).toBe('ci-cd')
    expect(tagSlug('a——b')).toBe('a-b')
  })

  it('trims hyphens from both ends', () => {
    expect(tagSlug('  !leading and trailing!  ')).toBe('leading-and-trailing')
  })

  it('is idempotent — slugging a slug changes nothing', () => {
    for (const tag of ['Design Systems', 'CI / CD', 'C++', 'accessibility']) {
      expect(tagSlug(tagSlug(tag))).toBe(tagSlug(tag))
    }
  })

  it('produces a URL-safe string for anything authored', () => {
    for (const tag of ['C++', 'Vue.js', '日本語', 'a/b', '100% done']) {
      expect(tagSlug(tag)).toMatch(/^[a-z0-9-]*$/)
    }
  })

  /**
   * A tag of only non-Latin characters slugs to an empty string, which would build the route
   * `/blog/tag/` — the listing, not a tag page. Recorded as known behaviour rather than asserted
   * as correct: it cannot happen with the current content, and the fix (transliterate, or reject
   * at the schema) is a content decision rather than a slug one.
   */
  it('collapses a tag with no Latin characters to an empty slug', () => {
    expect(tagSlug('日本語')).toBe('')
  })
})

describe('tagPath', () => {
  it('builds the route the prerenderer will discover', () => {
    expect(tagPath('Design Systems')).toBe('/blog/tag/design-systems')
  })
})
