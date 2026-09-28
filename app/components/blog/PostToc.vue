<script setup lang="ts">
/**
 * "On this page" — the post's h2/h3 outline as in-page links.
 *
 * Plain <a href="#id"> rather than NuxtLink: these are hash jumps within the page, and Router
 * would stamp aria-current="page" on every one of them, since it ignores the hash when matching.
 *
 * `data-ds-section-link` hands each link to the same observer in enhance.js that drives the
 * home page nav, so the heading being read is marked with aria-current and styled from that
 * attribute. Every link starts at "false" so the script updates a value rather than inventing
 * one — the same contract TheHeader follows.
 *
 * A post with a single section has no outline worth navigating, so nothing renders.
 */
interface TocLink {
  id: string
  text: string
  children?: TocLink[]
}

const { links } = defineProps<{ links: TocLink[] }>()
</script>

<template>
  <nav v-if="links.length > 1" aria-label="On this page">
    <ol class="space-y-1 border-s border-hairline text-sm">
      <li v-for="link in links" :key="link.id">
        <a
          :href="`#${link.id}`"
          :data-ds-section-link="link.id"
          aria-current="false"
          class="ds-toc-link"
        >{{ link.text }}</a>

        <ol v-if="link.children?.length" class="space-y-1">
          <li v-for="child in link.children" :key="child.id">
            <a
              :href="`#${child.id}`"
              :data-ds-section-link="child.id"
              aria-current="false"
              class="ds-toc-link ps-7"
            >{{ child.text }}</a>
          </li>
        </ol>
      </li>
    </ol>
  </nav>
</template>
