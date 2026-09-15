import { describe, expect, it } from 'vitest'
import { useFormatDate } from '../../app/composables/useFormatDate'

const { formatDate } = useFormatDate()

describe('formatDate', () => {
  it('renders an ISO date in long form', () => {
    expect(formatDate('2026-09-02')).toBe('2 September 2026')
  })

  /**
   * The reason the composable appends `T00:00:00Z` rather than passing the date straight to
   * `new Date()`. A published date that shifts by a day depending on the reader's timezone is
   * the kind of bug nobody notices until someone west of Greenwich reports the wrong date — so
   * it is pinned here rather than trusted.
   */
  it('does not shift by a day in a timezone behind UTC', () => {
    const original = process.env.TZ
    try {
      process.env.TZ = 'America/Los_Angeles'
      expect(formatDate('2026-01-01')).toBe('1 January 2026')
    }
    finally {
      process.env.TZ = original
    }
  })

  it('falls back to the raw string rather than rendering "Invalid Date"', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('honours the locale', () => {
    expect(formatDate('2026-09-02', 'de-DE')).toBe('2. September 2026')
  })
})
