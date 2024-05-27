<script setup lang="ts">
import { LocaleManager } from '@bryntum/schedulerpro-trial'
import '@bryntum/schedulerpro-trial/locales/schedulerpro.locale.En'
import '@bryntum/schedulerpro-trial/locales/schedulerpro.locale.Tr'
import { LoadingScreen } from 'ui'

const { locale } = useI18n()

watch(() => locale.value, (newLocale: string) => {
  if (newLocale === 'tr') {
    LocaleManager.locale = 'Tr'
  } else {
    LocaleManager.locale = 'En'
  }
})
// @ts-expect-error TODO: window augmentation
globalThis.bryntum ??= {}
// @ts-expect-error TODO: window augmentation
globalThis.bryntum.isTestEnv = true
</script>

<template>
  <Suspense>
    <template #fallback>
      <LoadingScreen
        first-message="App is Loading"
        second-message="Please Wait!"
        image="/eliarkurumsal.png"
      />
    </template>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </Suspense>
</template>

<style>
::-webkit-scrollbar {
  width: 0.55rem;
  height: 100%;
}

::-webkit-scrollbar-thumb {
  background-color: #0d94fc;
  opacity: 50%;
  border-radius: 10px;
}
</style>
