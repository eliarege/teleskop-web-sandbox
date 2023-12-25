<script setup lang="ts">
import { LoadingScreen, MachineCard } from 'ui'

globalThis.bryntum ??= {}
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
