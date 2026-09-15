import { absolute, getFeedPosts } from '../utils/feed'

export default defineEventHandler(async (event) => {
  const { profile } = useAppConfig()
  const posts = await getFeedPosts(event)

  setHeader(event, 'content-type', 'application/feed+json; charset=utf-8')

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: profile.name,
    description: profile.intro,
    home_page_url: absolute(event, '/'),
    feed_url: absolute(event, '/feed.json'),
    language: 'en',
    authors: [{ name: profile.name, url: absolute(event, '/') }],
    items: posts.map(post => ({
      id: absolute(event, post.path),
      url: absolute(event, post.path),
      title: post.title,
      summary: post.description,
      // JSON Feed wants RFC 3339; the frontmatter is a date with no time, so anchor it to UTC
      // midnight rather than letting the build machine's timezone decide.
      date_published: `${post.date}T00:00:00Z`,
      date_modified: `${post.updated ?? post.date}T00:00:00Z`,
      tags: post.tags ?? [],
    })),
  }
})
