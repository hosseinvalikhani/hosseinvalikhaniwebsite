import { describe, expect, it } from 'vitest'
import { countWords, readingTimeMinutes, WPM, withReadingTime } from '../../lib/reading-time'

const frontmatter = (eol: string) => [
  '---',
  'title: A post',
  'description: One sentence.',
  '---',
  '',
  'Body text.',
].join(eol)

describe('readingTimeMinutes', () => {
  it('never reports less than a minute', () => {
    expect(readingTimeMinutes('one two three')).toBe(1)
  })

  it('rounds up rather than down', () => {
    // One word past a whole minute should read as the next minute, not the same one.
    expect(readingTimeMinutes('word '.repeat(WPM + 1))).toBe(2)
    expect(readingTimeMinutes('word '.repeat(WPM))).toBe(1)
  })

  it('counts words, not whitespace', () => {
    expect(countWords('  a \n\n b \t c  ')).toBe(3)
  })
})

describe('withReadingTime', () => {
  /**
   * The bug this file was extracted to pin down.
   *
   * Authoring happens on Windows, so a `\r\n` after the opening `---` is normal. A `/^---\n/`
   * pattern matches nothing there — and fails silently, leaving `readingTime` undefined on every
   * post with no error anywhere in the build. Both line endings are asserted so that a future
   * simplification of the regex cannot quietly reintroduce it.
   */
  it.each([['LF', '\n'], ['CRLF', '\r\n']])('injects readingTime after %s frontmatter', (_name, eol) => {
    const out = withReadingTime(frontmatter(eol))
    expect(out).toMatch(/^---\r?\nreadingTime: \d+\n/)
  })

  it('keeps the original frontmatter intact', () => {
    const out = withReadingTime(frontmatter('\n'))
    expect(out).toContain('title: A post')
    expect(out).toContain('description: One sentence.')
    expect(out).toContain('Body text.')
  })

  it('leaves a file with no frontmatter alone', () => {
    const body = 'Just a body, no frontmatter.'
    expect(withReadingTime(body)).toBe(body)
  })

  it('does not inject twice when run over its own output', () => {
    const once = withReadingTime(frontmatter('\n'))
    const twice = withReadingTime(once)
    expect(twice.match(/readingTime:/g)).toHaveLength(1)
  })
})
