<script setup lang="ts">
/**
 * A modal dialog built on the native `<dialog>` element.
 *
 * `showModal()` gives us, for free and correctly, everything a dialog library ships thousands
 * of lines to approximate:
 *   - a real focus trap, maintained by the browser
 *   - the rest of the page made `inert`, so it is unreachable by tab, pointer *and* screen
 *     reader — not just visually covered
 *   - Escape to dismiss
 *   - focus returned to whatever opened it, without us storing a reference
 *   - the top layer, so no z-index stacking to manage
 *
 * That is why the plan has no reka-ui and no focus-trap dependency — and why dropping the Vue
 * client bundle in Phase 13 cost this component almost nothing. The only things the platform
 * does not supply are the open trigger and light-dismiss, and both live in public/enhance.js.
 *
 * The dialog is addressed by `id`: anything with `data-ds-dialog-open="<id>"` opens it. That is
 * the same contract `<button popovertarget>` uses, and it means a trigger does not have to be
 * anywhere near the dialog in the markup.
 */
const { id, title, describedBy } = defineProps<{
  /** Opened by any element carrying `data-ds-dialog-open` with this value. */
  id: string
  /** Accessible name for the dialog. Rendered visibly unless `hideTitle` is set. */
  title: string
  hideTitle?: boolean
  describedBy?: string
}>()

const titleId = computed(() => `${id}-title`)
</script>

<template>
  <dialog
    :id="id"
    class="ds-dialog"
    :aria-labelledby="titleId"
    :aria-describedby="describedBy"
  >
    <div class="ds-dialog__panel">
      <div class="flex items-start justify-between gap-4">
        <h2 :id="titleId" :class="hideTitle ? 'sr-only' : 'text-2xl font-bold'">
          {{ title }}
        </h2>
        <DsButton
          icon-only
          icon="close"
          label="Close dialog"
          variant="ghost"
          size="sm"
          data-ds-dialog-close
        />
      </div>

      <div class="mt-6">
        <slot />
      </div>
    </div>
  </dialog>
</template>
