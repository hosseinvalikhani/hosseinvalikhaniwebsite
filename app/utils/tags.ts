/**
 * Tag slugs.
 *
 * Tags are authored freely in frontmatter, so they cannot be trusted to be URL-safe. This is
 * the single place that maps a tag to its route, which matters because the mapping is used in
 * three places that must agree exactly: the links on cards and posts, the prerendered route,
 * and the lookup that resolves a slug back to its posts. If any one of them disagreed, the
 * link would 404 — or worse, prerender a page nothing links to.
 */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function tagPath(tag: string): string {
  return `/blog/tag/${tagSlug(tag)}`
}
