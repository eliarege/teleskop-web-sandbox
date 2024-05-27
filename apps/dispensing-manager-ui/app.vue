<script setup lang="ts">
import { useQuasar } from 'quasar'
import languageTR from 'quasar/lang/tr'

const { t } = useI18n()
useHead({
  title: () => t('app.name'),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
.q-field--filled .q-field__control {
    border-radius: 4px 4px 0 0;
    background-color: rgba(0, 0, 0, 0.2);
}

.q-radio__inner--truthy {
    color: #000000;
}
.q-checkbox__inner--truthy, .q-checkbox__inner--indet {
    color: #000000;
}

::-webkit-scrollbar {
  width: 0.55rem;
  height: 100%;
}

::-webkit-scrollbar-thumb {
  background-color: #000000;
  opacity: 50%;
  border-radius: 10px;
}
</style>
