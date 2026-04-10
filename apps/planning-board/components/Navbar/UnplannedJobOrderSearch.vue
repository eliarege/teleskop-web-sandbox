<script setup lang="ts">
import { useSettingStore } from '~/store/settings'

const store = useSettingStore()
const { t } = useI18n()
</script>

<template>
  <q-input
    v-model="store.unplannedText"
    dense
    dark
    flat
    borderless
    :placeholder="t('navbar.unplanned-search')"
    clearable
    text-color="gray-1"
    class="border-1 border-gray-300 rounded min-w-[240px]"
  >
    <template #before>
      <br>
    </template>
  </q-input>
</template>

<style scoped lang="postcss">
</style>
