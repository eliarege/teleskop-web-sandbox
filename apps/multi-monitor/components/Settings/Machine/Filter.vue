<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const { t } = useI18n()
const store = useDataStore()

const machineGroups = computed(() => new Set(store.machines.map(g => g.groupName)))
</script>

<template>
  <div class="w-full">
    <span class="settings-sub-title inline-block mb-2px">
      {{ t('settings.filter.title') }}
    </span>
    <div class="grid grid-cols-4 gap-x-50 w-min min-w-100 whitespace-nowrap">
      <div
        v-for="item in store.machines"
        :key="item.id"
        class="max-h-50 w-1/6 gap-0"
      >
        <q-checkbox
          :label="item.name"
          dense
          :model-value="!store.filteredMachines.has(item.id)"
          @update:model-value="(r) => r ? store.filteredMachines.delete(item.id) : store.filteredMachines.add(item.id)"
        />
      </div>
    </div>

    <q-separator class="my-10" />
    <span class="settings-sub-title inline-block mb-2px">
      {{ t('settings.filter.group-title') }}
    </span>
    <div class="grid grid-cols-4 gap-x-50 pb-10 w-min min-w-100 whitespace-nowrap">
      <div v-for="(item, idx) in machineGroups" :key="idx">
        <q-checkbox
          dense
          :label="item"
          :model-value="!store.filteredGroups.has(item)"
          @update:model-value="(r) => r ? store.filteredGroups.delete(item) : store.filteredGroups.add(item)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
