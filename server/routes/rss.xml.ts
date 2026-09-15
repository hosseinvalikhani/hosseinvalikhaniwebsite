import { absolute, getFeedPosts, rfc822, xmlEscape } from '../utils/feed'

export default defineEventHandler(async (event) => {
  const { profile } = useAppConfig()
  const posts = await getFeedPosts(event)

  const items = posts.map(post => `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${absolute(event, post.path)}</link>
      <guid isPermaLink="true">${absolute(event, post.path)}</guid>
      <pubDate>${rfc822(post.updated ?? post.date)}</pubDate>
      <description>${xmlEscape(post.description)}</description>
${(post.tags ?? []).map(tag => `      <category>${xmlEscape(tag)}</category>`).join('\n')}
    </item>`).join('\n')

  // The atom:self link is not decorative: without it some aggregators cannot tell two feeds
  // apart after a domain change, and treat every item as new.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(profile.name)}</title>
    <link>${absolute(event, '/')}</link>
    <description>${xmlEscape(profile.intro)}</description>
    <language>en</language>
    <lastBuildDate>${posts[0] ? rfc822(posts[0].updated ?? posts[0].date) : new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${absolute(event, '/rss.xml')}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return xml
})
