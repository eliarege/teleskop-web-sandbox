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
    <div class="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-2 gap-x-50 md:gap-x-50 sm:gap-x-2 gap-y-2 w-min md:w-min sm:w-full min-w-100 md:min-w-100 sm:min-w-full whitespace-nowrap md:whitespace-nowrap sm:whitespace-normal">
      <div
        v-for="item in store.machines"
        :key="item.id"
        class="max-h-50 w-1/6 md:w-1/6 sm:w-full gap-0"
      >
        <q-checkbox
          :label="item.name"
          dense
          :model-value="!store.filteredMachines.has(item.id)"
          class="md:text-sm sm:text-xs"
          @update:model-value="(r) => r ? store.filteredMachines.delete(item.id) : store.filteredMachines.add(item.id)"
        />
      </div>
    </div>

    <q-separator class="my-10 md:my-10 sm:my-4" />
    <span class="settings-sub-title inline-block mb-2px">
      {{ t('settings.filter.group-title') }}
    </span>
    <div class="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-2 gap-x-50 md:gap-x-50 sm:gap-x-2 gap-y-2 pb-10 md:pb-10 sm:pb-4 w-min md:w-min sm:w-full min-w-100 md:min-w-100 sm:min-w-full whitespace-nowrap md:whitespace-nowrap sm:whitespace-normal">
      <div
        v-for="(item, idx) in machineGroups"
        :key="idx"
        class="md:w-auto sm:w-full"
      >
        <q-checkbox
          dense
          :label="item"
          :model-value="!store.filteredGroups.has(item)"
          class="md:text-sm sm:text-xs"
          @update:model-value="(r) => r ? store.filteredGroups.delete(item) : store.filteredGroups.add(item)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
