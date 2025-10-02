<script setup lang="ts">
import {
  sharpOfflineBolt,
} from '@quasar/extras/material-icons-sharp'
import { useDataStore } from '~/store/Datas'

const { t } = useI18n()
const store = useDataStore()
</script>

<template>
  <div class="p-4 flex justify-between gap-3 bg-gray-100 rounded m-1 py-1">
    <span class="settings-title inline-block mb-3">
      {{ t('settings.animation') }}
    </span>
    <div class="flex items-center justify-start gap-3 w-full">
      <span> {{ t('settings.scrollSpeed') }}</span>
      <q-rating
        v-model="store.scrollSpeed"
        size="2em"
        color="black"
        :icon="sharpOfflineBolt"
        no-reset
      />
    </div>
    <div class="flex w-full">
      <q-btn
        v-if="store.scrollAnimationActive"
        color="primary"
        outline
        :label="t('settings.animation-end')"
        @click="store.scrollAnimationActive = !store.scrollAnimationActive"
      />
      <q-btn
        v-else
        color="primary"
        outline
        :label="t('settings.animation-start')"
        @click="store.scrollAnimationActive = !store.scrollAnimationActive"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
