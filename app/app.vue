<script setup lang="ts">
// Phase 1 scaffold only. The real shell (skip link, header, main, footer) arrives in Phase 5,
// and every colour here becomes a semantic token in Phase 2.
const colorMode = useColorMode()

const modes = ['system', 'light', 'dark'] as const

function cycleTheme() {
  const next = modes[(modes.indexOf(colorMode.preference as typeof modes[number]) + 1) % modes.length]
  colorMode.preference = next!
}
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-950 dark:bg-[#020420] dark:text-slate-50">
    <main class="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6">
      <p class="font-mono text-xs font-bold tracking-[0.2em] text-emerald-600 uppercase dark:text-[#00DC82]">
        Phase 1 · running skeleton
      </p>

      <h1 class="text-4xl font-extrabold tracking-tight sm:text-6xl">
        Nuxt 4 boots, Tailwind v4 compiles, the theme switches.
      </h1>

      <p class="text-lg text-slate-600 dark:text-slate-400">
        Nothing here is designed yet — these are raw Tailwind colours standing in until the token
        layer lands in Phase 2. What this page proves is that the toolchain works end to end.
      </p>

      <div class="flex flex-wrap items-center gap-4">
        <button
          type="button"
          class="rounded-xl border border-slate-300 px-4 py-2.5 font-medium transition-colors hover:bg-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
          @click="cycleTheme"
        >
          Theme: {{ colorMode.preference }}
        </button>
        <span class="font-mono text-sm text-slate-500">
          resolved: {{ colorMode.value }}
        </span>
      </div>
    </main>
  </div>
</template>
