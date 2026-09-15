import type { H3Event } from 'h3'
// Server-side the composable is getSiteConfig(event), not the app's useSiteConfig() — and it
// is not auto-imported in server/utils, so the failure is a bare "useSiteConfig is not
// defined" at prerender time rather than a type error.
import { getSiteConfig } from '#site-config/server/composables'
// The server-side queryCollection takes (event, collection); the auto-imported app-side one
// takes just the collection, so without this import the call type-errors while still working
// at runtime — which is the confusing combination.
import { queryCollection } from '@nuxt/content/server'

/**
 * Shared data for the three machine-readable surfaces (RSS, JSON Feed, llms.txt).
 *
 * One query in one place, because a feed that disagrees with the sitemap or with the site
 * itself is worse than no feed — a reader's client caches the wrong thing and shows it for
 * days. Drafts are excluded here rather than in each caller, so a new surface cannot forget.
 */
export interface FeedPost {
  path: string
  title: string
  description: string
  date: string
  updated?: string
  tags?: string[]
}

export async function getFeedPosts(event: H3Event): Promise<FeedPost[]> {
  const posts = await queryCollection(event, 'blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .select('path', 'title', 'description', 'date', 'updated', 'tags')
    .all()

  return posts as FeedPost[]
}

/** Absolute URL for a path, from the configured site URL. */
export function absolute(event: H3Event, path: string): string {
  const base = String(getSiteConfig(event).url ?? '').replace(/\/$/, '')
  return `${base}${path}`
}

/**
 * RFC 822, which is what RSS requires — not ISO 8601. Readers vary in how forgiving they are,
 * and a date they cannot parse usually shows as the epoch or as "now", either of which
 * reorders the feed.
 */
export function rfc822(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toUTCString()
}

/** XML text escaping. Titles contain apostrophes and ampersands often enough to matter. */
export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
