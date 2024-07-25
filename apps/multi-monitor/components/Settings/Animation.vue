<script setup lang="ts">
import {
  sharpOfflineBolt,
} from '@quasar/extras/material-icons-sharp'
import { useDataStore } from '~/store/Datas'

const { t } = useI18n()
const store = useDataStore()
</script>

<template>
  <div class="p-4 flex justify-between gap-3">
    <div class="flex-center gap-3 w-full">
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
      <q-space />
      <ElButton
        v-if="store.scrollAnimationActive"
        color="#0d94fc"
        plain
        @click="store.scrollAnimationActive = !store.scrollAnimationActive"
      >
        {{ t("settings.animation-end") }}
      </ElButton>
      <ElButton
        v-else
        color="#0d94fc"
        plain
        @click="store.scrollAnimationActive = !store.scrollAnimationActive"
      >
        {{ t("settings.animation-start") }}
      </ElButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
