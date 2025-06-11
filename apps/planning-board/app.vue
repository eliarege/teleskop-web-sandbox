<script setup lang="ts">
import { LocaleManager } from '@bryntum/schedulerpro'
import '@bryntum/schedulerpro/locales/schedulerpro.locale.En'
import '@bryntum/schedulerpro/locales/schedulerpro.locale.Tr'

const { locale } = useI18n()

watch(() => locale.value, (newLocale: string) => {
  if (newLocale === 'tr') {
    LocaleManager.locale = 'Tr'
  } else {
    LocaleManager.locale = 'En'
  }
})
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
    <NuxtPage />
  </Suspense>
</template>

<style>
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #f5f5f5;
}

::-webkit-scrollbar {
  width: 0.55rem;
  height: 0.55rem;
  background-color: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #0d94fc;
}
</style>
