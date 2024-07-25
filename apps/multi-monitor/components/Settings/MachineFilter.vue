<script setup lang="ts">
import { useDataStore } from '~/store/Datas'

const { t } = useI18n()
const store = useDataStore()

const machineGroups = computed(() => new Set(store.machines.map(g => g.groupName)))
</script>

<template>
  <div>
    <span class="w-full flex-center font-extrabold">
      {{ t('settings.filter.title') }}
    </span>
    <div class="grid grid-cols-3">
      <div
        v-for="item in store.machines"
        :key="item.id"
        class="max-h-50"
      >
        <q-checkbox
          :label="item.name"
          :model-value="!store.filteredMachines.has(item.id)"
          @update:model-value="(r) => r ? store.filteredMachines.delete(item.id) : store.filteredMachines.add(item.id)"
        />
      </div>
    </div>

    <q-separator spaced />
    <span class="w-full flex-center font-extrabold">
      {{ t('settings.filter.group-title') }}
    </span>
    <div class="grid grid-cols-3">
      <div v-for="(item, idx) in machineGroups" :key="idx">
        <q-checkbox
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
