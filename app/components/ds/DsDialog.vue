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
 * That is why the plan has no reka-ui and no focus-trap dependency.
 */
const open = defineModel<boolean>('open', { default: false })

const { title, describedBy } = defineProps<{
  /** Accessible name for the dialog. Rendered visibly unless `hideTitle` is set. */
  title: string
  hideTitle?: boolean
  describedBy?: string
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

watch(open, (isOpen) => {
  const el = dialog.value
  if (!el) return
  // Guard both ways: calling showModal() on an already-open dialog throws.
  if (isOpen && !el.open) el.showModal()
  else if (!isOpen && el.open) el.close()
})

/** Escape and form-method=dialog both fire `close`, so sync the model from the element. */
function onClose() {
  open.value = false
}

/**
 * Light-dismiss. A click on the backdrop reports the <dialog> itself as the target, because the
 * backdrop is its pseudo-element — anything inside the content wrapper targets that instead.
 */
function onClick(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog
    ref="dialog"
    class="ds-dialog"
    :aria-labelledby="titleId"
    :aria-describedby="describedBy"
    @close="onClose"
    @click="onClick"
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
          @click="open = false"
        />
      </div>

      <div class="mt-6">
        <slot />
      </div>
    </div>
  </dialog>
</template>
