<script setup lang="ts">
/**
 * A single post.
 *
 * The 404 is thrown during data fetching rather than rendered as an empty state, so a bad slug
 * produces a real 404 status for crawlers instead of a 200 page saying "not found" — which is
 * the classic soft-404 that gets thin pages indexed.
 *
 * Layout: one column at the article measure below lg, and from lg up that same column beside a
 * sticky outline. The outline is rendered twice — a <details> above the body for narrow screens,
 * a sticky <aside> for wide ones — rather than one element moved by CSS, because <details> cannot
 * be held open by a stylesheet and a sticky rail cannot be collapsed. Only one is ever displayed,
 * so only one is in the accessibility tree.
 */
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: post } = await useAsyncData(`blog-${slug.value}`, () =>
  queryCollection('blog').path(`/blog/${slug.value}`).first(),
)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

// One call: article meta, OG image and the BlogPosting + breadcrumb graph, so post SEO cannot
// drift between here and anywhere else a post is rendered.
usePostSeo(post.value)

const toc = computed(() => post.value?.body?.toc?.links ?? [])
</script>

<template>
  <article v-if="post" class="py-16 sm:py-24">
    <DsContainer>
      <!-- The rail is only reserved when there is an outline to put in it; otherwise the column
           would sit off-centre beside an empty track. -->
      <div
        class="mx-auto max-w-article"
        :class="toc.length > 1 && 'lg:grid lg:max-w-none lg:grid-cols-[minmax(0,var(--container-article))_14rem] lg:justify-center lg:gap-16'"
      >
        <div class="min-w-0">
          <DsBreadcrumb
            :items="[
              { label: 'Home', to: '/' },
              { label: 'Blog', to: '/blog' },
              { label: post.title },
            ]"
          />

          <header class="mt-8 border-b border-hairline pb-8">
            <TagList :tags="post.tags ?? []" size="sm" linked />

            <h1 class="mt-5 text-3xl font-bold text-balance">
              {{ post.title }}
            </h1>

            <!-- The meta description, shown as the standfirst: what the search result promises is
                 the first thing the page says. -->
            <p class="mt-5 text-lg text-fg-muted text-pretty sm:text-xl">
              {{ post.description }}
            </p>

            <div class="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <PostByline />
              <PostMeta :date="post.date" :updated="post.updated" :reading-time="post.readingTime" />
            </div>
          </header>

          <!--
            The cover is cropped to the 1200×630 shape every OG image uses, which is what lets it
            declare dimensions (check-output requires them) without the schema carrying any.
            Eager and high priority: when a post has one, it is the likeliest LCP element.
          -->
          <NuxtImg
            v-if="post.image"
            :src="post.image"
            :alt="post.imageAlt ?? ''"
            width="1200"
            height="630"
            loading="eager"
            fetchpriority="high"
            sizes="xs:100vw sm:100vw md:768px"
            class="mt-10 aspect-[1200/630] h-auto w-full rounded-panel border border-hairline bg-surface object-cover"
          />

          <details v-if="toc.length > 1" class="group mt-10 rounded-panel border border-hairline bg-surface lg:hidden">
            <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden">
              On this page
              <span class="text-fg-subtle transition-transform duration-base group-open:rotate-180">
                <DsIcon name="chevron-down" />
              </span>
            </summary>
            <div class="border-t border-hairline px-5 py-4">
              <PostToc :links="toc" />
            </div>
          </details>

          <div class="mt-10">
            <ContentRenderer :value="post" />
          </div>

          <footer class="mt-16 space-y-8 border-t border-hairline pt-8">
            <PostPager :path="post.path" />

            <DsButton to="/blog" variant="secondary" icon="arrow-up-right">
              All posts
            </DsButton>
          </footer>
        </div>

        <aside v-if="toc.length > 1" class="hidden lg:block">
          <div class="sticky top-[calc(var(--header-h)+2rem)] max-h-[calc(100dvh-var(--header-h)-4rem)] overflow-y-auto">
            <p class="font-mono text-xs uppercase tracking-wider text-fg-subtle">
              On this page
            </p>
            <div class="mt-4">
              <PostToc :links="toc" />
            </div>
          </div>
        </aside>
      </div>
    </DsContainer>
  </article>
</template>
