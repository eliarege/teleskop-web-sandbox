<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
const { t } = useI18n()
</script>

<template>
  <div class="w-full bg-gray-100 rounded m-1 px-2 py-1">
    <span class="settings-title inline-block mb-3">{{ t('settings.machine-settings') }}</span>
    <div class="flex w-full h-full gap-3">
      <SettingsMachineSort :machines="store.machines" />
      <SettingsMachineErpParameters :machines="store.machines" />
    </div>
    <q-separator class="my-10" />
    <SettingsMachineFilter />
  </div>
</template>

<style scoped lang="postcss">
</style>
