<script setup lang="ts">
import { useQuasar } from 'quasar'
import languageTR from 'quasar/lang/tr'

const $q = useQuasar()
$q.lang.set(languageTR)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
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
