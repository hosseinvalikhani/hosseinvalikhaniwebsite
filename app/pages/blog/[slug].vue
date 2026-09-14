<script setup lang="ts">
/**
 * A single post.
 *
 * The 404 is thrown during data fetching rather than rendered as an empty state, so a bad slug
 * produces a real 404 status for crawlers instead of a 200 page saying "not found" — which is
 * the classic soft-404 that gets thin pages indexed.
 */
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: post } = await useAsyncData(`blog-${slug.value}`, () =>
  queryCollection('blog').path(`/blog/${slug.value}`).first(),
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

useSeoMeta({
  title: post.value.title,
  description: post.value.description,
})
</script>

<template>
  <article v-if="post" class="py-16 sm:py-24">
    <DsContainer width="prose">
      <DsBreadcrumb
        :items="[
          { label: 'Home', to: '/' },
          { label: 'Blog', to: '/blog' },
          { label: post.title },
        ]"
      />

      <header class="mt-8">
        <h1 class="text-3xl text-balance">
          {{ post.title }}
        </h1>

        <div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
          <PostMeta :date="post.date" :reading-time="post.readingTime" />
          <TagList :tags="post.tags ?? []" size="sm" linked />
        </div>
      </header>

      <div class="mt-12">
        <ContentRenderer :value="post" />
      </div>

      <footer class="mt-16 border-t border-hairline pt-8">
        <DsButton to="/blog" variant="secondary" icon="arrow-up-right">
          All posts
        </DsButton>
      </footer>
    </DsContainer>
  </article>
</template>
