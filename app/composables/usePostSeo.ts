interface PostLike {
  path?: string
  title?: string
  description?: string
  date?: string
  updated?: string
  tags?: string[]
  readingTime?: number
  image?: string
}

/**
 * All of a post's SEO in one call, so it cannot drift between the post page and anything else
 * that renders a post later.
 *
 * Every property here corresponds to something visible on the page. That is a deliberate
 * constraint rather than a stylistic one: structured data describing content a reader cannot
 * see is what "spammy structured data" means, and it is a manual-action category in Search
 * Console — not merely ineffective.
 */
export function usePostSeo(post: PostLike) {
  const { profile } = useAppConfig()

  const title = post.title ?? 'Untitled'
  const description = post.description ?? ''

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    // Only set when the post actually declares them — an empty article:modified_time is worse
    // than none, and articleAuthor has to match the byline a reader can see.
    articlePublishedTime: post.date,
    articleModifiedTime: post.updated ?? post.date,
    articleAuthor: [profile.name],
    articleTag: post.tags,
  })

  defineOgImage('Default', {
    title,
    name: profile.name,
    label: post.tags?.[0] ?? 'Writing',
  })

  useSchemaOrg([
    defineArticle({
      '@type': 'BlogPosting',
      'headline': title,
      'description': description,
      'datePublished': post.date,
      'dateModified': post.updated ?? post.date,
      'keywords': post.tags,
      // Both are rendered on the page — the reading time in the meta row, the image as the
      // post's cover — which is the condition for declaring them here at all.
      ...(post.readingTime ? { timeRequired: `PT${post.readingTime}M` } : {}),
      ...(post.image ? { image: post.image } : {}),
      'author': { '@id': `${useSiteConfig().url}/#identity` },
    }),
    defineBreadcrumb({
      itemListElement: [
        { name: 'Home', item: '/' },
        { name: 'Blog', item: '/blog' },
        { name: title, item: post.path ?? '/blog' },
      ],
    }),
  ])
}
