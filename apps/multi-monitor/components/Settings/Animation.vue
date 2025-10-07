<script setup lang="ts">
import {
  sharpOfflineBolt,
} from '@quasar/extras/material-icons-sharp'
import { useDataStore } from '~/store/Datas'

const { t } = useI18n()
const store = useDataStore()
</script>

<template>
  <div class="p-4 md:p-4 sm:p-2 flex md:flex sm:flex-col justify-between md:justify-between sm:justify-start gap-3 md:gap-3 sm:gap-4 bg-gray-100 rounded m-1 py-1">
    <span class="settings-title inline-block mb-3 md:mb-3 sm:mb-2">
      {{ t('settings.animation') }}
    </span>
    <div class="flex items-center justify-start md:justify-start sm:justify-between gap-3 w-full">
      <span class="md:text-base sm:text-sm"> {{ t('settings.scrollSpeed') }}</span>
      <q-rating
        v-model="store.scrollSpeed"
        size="2em"
        color="black"
        :icon="sharpOfflineBolt"
        no-reset
      />
    </div>
    <div class="flex w-full md:w-full sm:w-full justify-end md:justify-end sm:justify-center">
      <q-btn
        v-if="store.scrollAnimationActive"
        color="primary"
        outline
        :label="t('settings.animation-end')"
        class="md:text-base sm:text-sm"
        @click="store.scrollAnimationActive = !store.scrollAnimationActive"
      />
      <q-btn
        v-else
        color="primary"
        outline
        :label="t('settings.animation-start')"
        class="md:text-base sm:text-sm"
        @click="store.scrollAnimationActive = !store.scrollAnimationActive"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
