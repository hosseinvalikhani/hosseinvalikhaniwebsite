<script setup lang="ts">
/**
 * Posts for one tag.
 *
 * The cheapest real SEO win on a small blog: N posts become N + T indexable pages, each one a
 * genuine topical grouping rather than a thin filter view. That only holds while each page has
 * its own title and description — a set of tag pages sharing boilerplate is duplicate content
 * with extra steps.
 *
 * Filtering happens in JS rather than in the query because tags are an array and the collection
 * query has no contains operator. That costs nothing here: the page is prerendered, so this
 * runs once at build time, and select() keeps the bodies out of it.
 */
const route = useRoute()
const slug = computed(() => String(route.params.tag))

const { data } = await useAsyncData(`tag-${slug.value}`, async () => {
  const posts = await queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .select('path', 'title', 'description', 'date', 'tags', 'readingTime')
    .all()

  const matching = posts.filter(post => (post.tags ?? []).some(tag => tagSlug(tag) === slug.value))

  // Recover the tag's authored spelling — the slug is lossy, and the page should show the
  // label the author wrote rather than the hyphenated URL form.
  const label = matching
    .flatMap(post => post.tags ?? [])
    .find(tag => tagSlug(tag) === slug.value)

  return { posts: matching, label }
})

// A tag nobody used is not an empty listing, it is a URL that should not exist.
if (!data.value?.posts.length) {
  throw createError({ statusCode: 404, statusMessage: 'Tag not found', fatal: true })
}

const label = computed(() => data.value?.label ?? slug.value)
const count = computed(() => data.value?.posts.length ?? 0)

// Tags are shown exactly as authored rather than title-cased: "css" would become "Css" and
// "design-systems" would need a word list to split correctly. Quoting the tag instead lets the
// title read properly whatever spelling the author used.
useSeoMeta({
  title: `Posts tagged "${label.value}"`,
  description: () =>
    `${count.value} ${count.value === 1 ? 'post' : 'posts'} tagged "${label.value}" — writing on `
    + 'design systems, accessibility and building for the web.',
})
</script>

<template>
  <section v-if="data" class="py-16 sm:py-24">
    <DsContainer>
      <DsBreadcrumb
        :items="[
          { label: 'Home', to: '/' },
          { label: 'Blog', to: '/blog' },
          { label: label },
        ]"
      />

      <DsEyebrow class="mt-8">
        Tagged
      </DsEyebrow>
      <h1 class="mt-4 text-3xl text-balance">
        {{ label }}
      </h1>
      <p class="mt-6 max-w-prose text-lg text-fg-muted">
        {{ count }} {{ count === 1 ? 'post' : 'posts' }} on this topic.
      </p>

      <ul class="mt-12 grid gap-5 sm:grid-cols-2">
        <li v-for="post in data.posts" :key="post.path">
          <PostCard :post="post" />
        </li>
      </ul>

      <div class="mt-12">
        <DsButton to="/blog" variant="secondary">
          All posts
        </DsButton>
      </div>
    </DsContainer>
  </section>
</template>
