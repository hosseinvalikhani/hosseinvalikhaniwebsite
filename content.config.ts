import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z
        .object({
          title: z.string().min(10).max(70),
          // Used verbatim as the meta description. The bounds are deliberate: they turn a
          // truncated or missing description into a build failure rather than an SEO
          // regression discovered six months later.
          description: z.string().min(80).max(160),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be ISO YYYY-MM-DD'),
          updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'updated must be ISO YYYY-MM-DD').optional(),
          tags: z.array(z.string()).min(1).max(5).default([]),
          image: z.string().optional(),
          imageAlt: z.string().optional(),
          readingTime: z.number().optional(),
          draft: z.boolean().default(false),
        })
        // An image without alt text is an accessibility bug that is invisible until someone
        // hits it with a screen reader. Fail the build instead.
        .refine(v => !v.image || !!v.imageAlt, {
          message: 'imageAlt is required whenever image is set',
          path: ['imageAlt'],
        }),
    }),
  },
})
