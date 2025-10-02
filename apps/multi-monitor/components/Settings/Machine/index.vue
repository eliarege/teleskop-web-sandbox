<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const store = useDataStore()
const { t } = useI18n()
</script>

<template>
  <div class="w-full bg-gray-100 rounded m-1 py-1">
    <span class="settings-title inline-block mb-3">{{ t('settings.machine-settings') }}</span>
    <q-separator />
    <div class="grid grid-cols-2 w-full">
      <div>
        <span class="settings-sub-title inline-block mb-2px">
          {{ t("settings.sort-by") }}
        </span>
        <div>
          <q-option-group
            v-model="store.sortMachines"
            type="radio"
            dense
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
            :options="[
              { label: t('settings.sort-id'), value: 1 },
              { label: t('settings.sort-active'), value: 2 },
              { label: t('settings.sort-idle'), value: 3 },
              { label: t('settings.sort-group'), value: 4 },
              { label: t('settings.sort-custom'), value: 5 },
            ]"
          />
        </div>
      </div>
      <SettingsMachineSort :machines="store.machines" />
    </div>
    <q-separator class="my-10" />
    <div class="flex w-full h-full gap-3">
      <SettingsMachineErpParameters :machines="store.machines" />
    </div>
    <q-separator class="my-10" />
    <SettingsMachineFilter />
  </div>
</template>

<style scoped lang="postcss">
</style>
