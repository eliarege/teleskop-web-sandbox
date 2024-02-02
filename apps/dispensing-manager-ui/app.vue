<script setup lang="ts">
import { useQuasar } from 'quasar'
import languageTR from 'quasar/lang/tr'

const $q = useQuasar()
$q.lang.set(languageTR)
const { setLocale } = useI18n()
setLocale('tr')
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
.q-field--filled {
    border-radius: 4px 4px 0 0;
    background: rgba(0, 0, 0, 0.1);
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
