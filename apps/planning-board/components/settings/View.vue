<script setup lang="ts">
import type { QueueBasedAnyEvent } from '~/shared/queueBased'
import { useSettingStore } from '~/store/settings'

const { t } = useI18n()
const store = useSettingStore()

const actualEventsDropdown = computed(() => [
  { id: 1, label: t('settings.plan-area.dropDown.batchKey'), value: 'batchKey' },
  { id: 2, label: t('settings.plan-area.dropDown.planKey'), value: 'planKey' },
  { id: 3, label: t('settings.plan-area.dropDown.machineId'), value: 'machineId' },
  { id: 4, label: t('settings.plan-area.dropDown.jobOrder'), value: 'jobOrder' },
  { id: 5, label: t('settings.plan-area.dropDown.programList'), value: 'programNoList' },
  { id: 6, label: t('settings.plan-area.dropDown.startDate'), value: 'startTime' },
  { id: 7, label: t('settings.plan-area.dropDown.endTime'), value: 'endTime' },
  { id: 8, label: t('settings.plan-area.dropDown.theoreticalDuration'), value: 'theoreticalDuration' },
  { id: 9, label: t('settings.plan-area.dropDown.fabricWeight'), value: 'fabricWeight' },
  { id: 10, label: t('settings.plan-area.dropDown.deviation'), value: 'deviation' },
  { id: 11, label: t('settings.plan-area.dropDown.note'), value: 'note' },
  { id: 11, label: t('settings.plan-area.dropDown.partyNo'), value: 'partyNo' },
] as {
  id: number
  label: string
  value: keyof QueueBasedAnyEvent
}[])

const plannedEventsDropdown = computed(() => [
  { id: 1, label: t('settings.plan-area.dropDown.planKey'), value: 'planKey' },
  { id: 2, label: t('settings.plan-area.dropDown.machineId'), value: 'machineId' },
  { id: 3, label: t('settings.plan-area.dropDown.queueNumber'), value: 'queueNumber' },
  { id: 4, label: t('settings.plan-area.dropDown.jobOrder'), value: 'jobOrder' },
  { id: 5, label: t('settings.plan-area.dropDown.programList'), value: 'programList' },
  { id: 6, label: t('settings.plan-area.dropDown.theoreticalDuration'), value: 'theoreticalDuration' },
  { id: 7, label: t('settings.plan-area.dropDown.fabricWeight'), value: 'fabricWeight' },
  { id: 8, label: t('settings.plan-area.dropDown.note'), value: 'note' },
  { id: 9, label: t('settings.plan-area.dropDown.endTime'), value: 'endTime' },
  { id: 10, label: t('settings.plan-area.dropDown.startTime'), value: 'startTime' },
  { id: 11, label: t('settings.plan-area.dropDown.customer'), value: 'customer' },
  { id: 11, label: t('settings.plan-area.dropDown.partyNo'), value: 'partyNo' },
] as {
  id: number
  label: string
  value: keyof QueueBasedAnyEvent
}[])
</script>

<template>
  <div class="w-full h-full p-2">
    <SettingsItem
      v-model:dropdown="store.settings.plannedBatchText"
      v-model:color="store.settings.plannedBatchColor"
      v-model:fabric-color="store.settings.plannedBatchFabricColor"
      :event-name-label="t('settings.plan-area.planned.name')"
      :title="t('settings.plan-area.planned.title')"
      :dropdown-options="plannedEventsDropdown"
      :checkbox-text="t('settings.plan-area.show-on-fabric-color')"
    />

    <q-separator spaced />

    <SettingsItem
      v-model:dropdown="store.settings.ongoingBatchText"
      v-model:color="store.settings.ongoingBatchColor"
      v-model:fabric-color="store.settings.ongoingBatchFabricColor"
      :event-name-label="t('settings.plan-area.ongoing.name')"
      :title="t('settings.plan-area.ongoing.title')"
      :dropdown-options="actualEventsDropdown"
      :checkbox-text="t('settings.plan-area.show-on-fabric-color')"
    />

    <q-separator spaced />

    <SettingsItem
      v-model:dropdown="store.settings.completedBatchText"
      v-model:color="store.settings.completedBatchColor"
      v-model:fabric-color="store.settings.completedBatchFabricColor"
      :event-name-label="t('settings.plan-area.completed.name')"
      :title="t('settings.plan-area.completed.title')"
      :dropdown-options="actualEventsDropdown"
      :checkbox-text="t('settings.plan-area.show-on-fabric-color')"
    />

    <q-separator spaced />

    <SettingsItem
      v-model:fabric-color="store.settings.showStops.show"
      v-model:color="store.settings.showStops.color"
      :title="t('settings.plan-area.stops.main')"
      :checkbox-text="t('settings.plan-area.stops.title')"
      :is-deviation="true"
    />
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
