<script setup lang="ts">
/**
 * The post listing.
 *
 * `.select()` is a performance decision, not a stylistic one. Without it every post's full
 * parsed body is pulled into the query result and serialised into this page's prerendered
 * payload — on a listing that only ever shows a title, a description and a date. The payload
 * grows with the length of the blog rather than with the number of cards.
 */
const { data: posts } = await useAsyncData('blog-list', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .select('path', 'title', 'description', 'date', 'tags', 'readingTime')
    .all(),
)

useSeoMeta({
  title: 'Blog',
  description:
    'Notes on design systems, accessibility and building for the web — written while working '
    + 'things out rather than after the fact.',
})
</script>

<template>
  <section class="py-16 sm:py-24">
    <DsContainer>
      <DsEyebrow>Blog</DsEyebrow>
      <h1 class="mt-4 text-3xl text-balance">
        Writing
      </h1>
      <p class="mt-6 max-w-prose text-lg text-fg-muted text-pretty">
        Notes on design systems, accessibility and building for the web.
      </p>

      <ul v-if="posts?.length" class="mt-12 grid gap-5 sm:grid-cols-2">
        <li v-for="post in posts" :key="post.path">
          <PostCard :post="post" />
        </li>
      </ul>

      <!--
        An empty state is a sentence, not a shrug. "No posts found" tells the reader nothing
        about whether that is a bug, a filter, or simply the truth.
      -->
      <p v-else class="mt-12 max-w-prose text-lg text-fg-muted">
        Nothing published yet. The first posts are being written — check back, or follow along
        via the feed.
      </p>
    </DsContainer>
  </section>
</template>
