/**
 * Date formatting via Intl, which is why there is no date library in this project.
 *
 * The formatter is created once per locale rather than per call: constructing an
 * Intl.DateTimeFormat is the expensive part, and a blog listing formats one date per card.
 */
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(locale: string) {
  let formatter = formatters.get(locale)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    formatters.set(locale, formatter)
  }
  return formatter
}

export function useFormatDate() {
  /**
   * `2026-09-02` → `2 September 2026`.
   *
   * Parsed as UTC deliberately. `new Date('2026-09-02')` is already UTC midnight, but a reader
   * west of Greenwich would see it rendered as the 1st if it were formatted in local time —
   * a published date that silently shifts by a day depending on who is looking at it.
   */
  function formatDate(iso: string, locale = 'en-GB') {
    const date = new Date(`${iso}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) return iso
    return formatterFor(locale).format(date)
  }

  return { formatDate }
}
