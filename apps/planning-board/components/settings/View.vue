<script setup lang="ts">
import type { QueueBasedEvents } from '~/shared/queueBased'
import { useSettingStore } from '~/store/settings'

const { t } = useI18n()
const store = useSettingStore()

const actualEventsDropdown = computed(() => [
  { id: 1, label: t('settings.plan-area.dropDown.batchKey'), value: 'batchKey' },
  { id: 2, label: t('settings.plan-area.dropDown.planKey'), value: 'planKey' },
  { id: 3, label: t('settings.plan-area.dropDown.machineId'), value: 'machineId' },
  { id: 4, label: t('settings.plan-area.dropDown.jobOrder'), value: 'jobOrder' },
  { id: 5, label: t('settings.plan-area.dropDown.programNoList'), value: 'programNoList' },
  { id: 6, label: t('settings.plan-area.dropDown.startDate'), value: 'startTime' },
  { id: 7, label: t('settings.plan-area.dropDown.endTime'), value: 'endTime' },
  { id: 8, label: t('settings.plan-area.dropDown.cancelTime'), value: 'cancelTime' },
  { id: 9, label: t('settings.plan-area.dropDown.theoreticalDuration'), value: 'theoreticalDuration' },
  { id: 10, label: t('settings.plan-area.dropDown.fabricWeight'), value: 'fabricWeight' },
  { id: 11, label: t('settings.plan-area.dropDown.partyNumber'), value: 'partyNumber' },
  { id: 12, label: t('settings.plan-area.dropDown.deviation'), value: 'deviation' },
  { id: 13, label: t('settings.plan-area.dropDown.note'), value: 'note' },
  { id: 14, label: t('settings.plan-area.dropDown.customerName'), value: 'customerName' },
] as {
  id: number
  label: string
  value: keyof QueueBasedEvents
}[])

const plannedEventsDropdown = computed(() => [
  { id: 1, label: t('settings.plan-area.dropDown.planKey'), value: 'planKey' },
  { id: 2, label: t('settings.plan-area.dropDown.machineId'), value: 'machineId' },
  { id: 3, label: t('settings.plan-area.dropDown.queueNumber'), value: 'queueNumber' },
  { id: 4, label: t('settings.plan-area.dropDown.jobOrder'), value: 'jobOrder' },
  { id: 5, label: t('settings.plan-area.dropDown.programNoList'), value: 'programNoList' },
  { id: 6, label: t('settings.plan-area.dropDown.theoreticalDuration'), value: 'theoreticalDuration' },
  { id: 7, label: t('settings.plan-area.dropDown.fabricWeight'), value: 'fabricWeight' },
  { id: 8, label: t('settings.plan-area.dropDown.partyNumber'), value: 'partyNumber' },
  { id: 9, label: t('settings.plan-area.dropDown.note'), value: 'note' },
  { id: 10, label: t('settings.plan-area.dropDown.plannedStartDate'), value: 'plannedStartDate' },
  { id: 11, label: t('settings.plan-area.dropDown.endDate'), value: 'endDate' },
  { id: 12, label: t('settings.plan-area.dropDown.customerName'), value: 'customerName' },
] as {
  id: number
  label: string
  value: keyof QueueBasedEvents
}[])
</script>

<template>
  <div class="w-full h-full p-2">
    <div class="w-full h-min gap-2 p-3 grid grid-cols-2 border rounded px-40">
      <SettingsItem
        v-model:color="store.settings.deviationColor"
        :title="t('settings.plan-area.deviation.title')"
        :checkbox-text="t('settings.plan-area.deviation.show-deviation')"
        :is-deviation="true"
      />
      <SettingsItem
        v-model:fabric-color="store.settings.showStops.show"
        v-model:color="store.settings.showStops.color"
        :title="t('settings.plan-area.stops.main')"
        :checkbox-text="t('settings.plan-area.stops.title')"
        :is-deviation="true"
      />
    </div>
    <q-separator spaced />
    <div class="w-full h-full gap-2 p-3 grid grid-cols-3 border rounded">
      <SettingsItem
        v-model:dropdown="store.settings.plannedBatchText"
        v-model:color="store.settings.plannedBatchColor"
        v-model:fabric-color="store.settings.plannedBatchFabricColor"
        :title="t('settings.plan-area.planned.title')"
        :dropdown-options="plannedEventsDropdown"
        :checkbox-text="t('settings.plan-area.show-on-fabric-color')"
      />
      <SettingsItem
        v-model:dropdown="store.settings.ongoingBatchText"
        v-model:color="store.settings.ongoingBatchColor"
        v-model:fabric-color="store.settings.ongoingBatchFabricColor"
        :title="t('settings.plan-area.ongoing.title')"
        :dropdown-options="actualEventsDropdown"
        :checkbox-text="t('settings.plan-area.show-on-fabric-color')"
      />
      <SettingsItem
        v-model:dropdown="store.settings.completedBatchText"
        v-model:color="store.settings.completedBatchColor"
        v-model:fabric-color="store.settings.completedBatchFabricColor"
        :title="t('settings.plan-area.completed.title')"
        :dropdown-options="actualEventsDropdown"
        :checkbox-text="t('settings.plan-area.show-on-fabric-color')"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.hover-shadow {
  box-shadow:
  rgba(0, 0, 0, 0.25) 0px 54px 55px,
  rgba(0, 0, 0, 0.12) 0px -12px 30px,
  rgba(0, 0, 0, 0.12) 0px 4px 6px,
  rgba(0, 0, 0, 0.17) 0px 12px 13px,
  rgba(0, 0, 0, 0.09) 0px -3px 5px;
}
</style>
