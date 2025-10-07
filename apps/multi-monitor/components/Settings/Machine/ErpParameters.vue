<script setup lang="ts">
import { useDataStore } from '~/store/Datas'
import type { MachineDataRaw } from '~/shared/types'

const store = useDataStore()
const { t } = useI18n()

const erpParameters = computed(() => {
  const keys = store.machines
    .map(m => Object.keys(m.erp ?? {}))
    .flat()
  return [...new Set(keys)]
})

const selected = ref(erpParameters.value[0])

const selectedMachines = computed(() => store.erpKeys.filter(e => e.key === selected.value).map(e => e.id))
const availableMachines = computed<MachineDataRaw[]>(() => store.machines.filter(e =>
  Object.keys(e.erp ?? {}).includes(selected.value),
))
</script>

<template>
  <div class="w-auto">
    <span class="settings-sub-title inline-block mb-2px">
      {{ t('settings.machine-parameter') }}
    </span>
    <div class="flex md:flex sm:flex-col gap-3 md:gap-3 sm:gap-4 w-full">
      <div class="md:flex-1 sm:w-full">
        <q-list
          dense
          bordered
          separator
          class="md:max-h-48 sm:max-h-32 overflow-auto"
        >
          <q-item
            v-for="(item, idx) in erpParameters"
            :key="idx"
            :active="selected === item"
            clickable
            bordered
            @click="selected = item"
          >
            <q-item-section>
              <span class="md:text-sm sm:text-xs">{{ item }}</span>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-space class="md:block sm:hidden" />
      <div class="md:flex-1 sm:w-full">
        <SettingsMachineMultiSelect
          v-model:selected-machine="selectedMachines"
          :machines="availableMachines"
          :erp-key="selected"
        />
      </div>
    </div>
  </div>
</template>
