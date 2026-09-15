import { absolute, getFeedPosts } from '../utils/feed'

/**
 * llms.txt — a plain-text index for language models, in the convention's markdown shape.
 *
 * It costs one prerendered file and removes the guesswork of extracting content from HTML.
 * Like every other surface here it lists only what is actually published: no drafts, and
 * nothing that is not reachable on the site.
 */
export default defineEventHandler(async (event) => {
  const { profile } = useAppConfig()
  const posts = await getFeedPosts(event)

  const lines = [
    `# ${profile.name}`,
    '',
    `> ${profile.title}. ${profile.intro}`,
    '',
    '## Pages',
    '',
    `- [Home](${absolute(event, '/')}): about, experience and skills.`,
    `- [Blog](${absolute(event, '/blog')}): writing on design systems, accessibility and the web.`,
    '',
    '## Posts',
    '',
    ...posts.map(post => `- [${post.title}](${absolute(event, post.path)}): ${post.description}`),
    '',
    '## Feeds',
    '',
    `- [RSS](${absolute(event, '/rss.xml')})`,
    `- [JSON Feed](${absolute(event, '/feed.json')})`,
    '',
  ]

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return lines.join('\n')
})
