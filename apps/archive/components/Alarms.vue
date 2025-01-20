<script setup lang="ts">
import { addMinutes } from 'date-fns'
import type { BatchAlarm } from '~/types/archive'
import { formatDuration } from '~/utils/functions'

const props = defineProps<{
  alarms: BatchAlarm[]
  selectedTime: Date
}>()
const emit = defineEmits<{
  (e: 'rowClicked', startTime: string): void
}>()
const { t, d } = useI18n()
const $q = useQuasar()

const alarmOptions = computed(() => [
  { label: t('alarmSettings.0'), value: 1 },
  { label: t('alarmSettings.1'), value: 2 },
  { label: t('alarmSettings.2'), value: 3 },
  { label: t('alarmSettings.3'), value: 4 },
  { label: t('alarmSettings.4'), value: 5 },
  { label: t('alarmSettings.5'), value: 6 },
  { label: t('alarmSettings.6'), value: 7 },
  { label: t('alarmSettings.7'), value: 8 },
  { label: t('alarmSettings.8'), value: 9 },
  { label: t('alarmSettings.9'), value: 10 },
  { label: t('alarmSettings.10'), value: 11 },
  { label: t('alarmSettings.11'), value: 12 },
])

const settingStore = userSettingsStore()

function toggleAlarmsettings() {
  $q.dialog({
    title: t('alarmSettings.title'),
    message: t('alarmSettings.message'),
    options: {
      type: 'checkbox',
      model: [...settingStore.alarmSettings],
      items: alarmOptions.value,
    },
    cancel: true,
  }).onOk((data) => {
    settingStore.updateAlarmSettings(data)
  })
}

function handleRowClick(_evt: any, row: Record<string, any>, _index: any) {
  emit('rowClicked', row.originalStartTime)
}

const checkLabel = t('alarmColumns.selected')

const columns = [
  {
    name: 'startTime',
    label: t('alarmColumns.startTime'),
    required: true,
    field: 'startTime',
    align: 'center' as const,
  },
  {
    name: 'endTime',
    label: t('alarmColumns.endTime'),
    required: true,
    field: 'endTime',
    align: 'center' as const,
  },
  {
    name: 'duration',
    label: t('alarmColumns.duration'),
    required: true,
    field: 'duration',
    align: 'center' as const,
  },
  {
    name: 'explanation',
    label: t('alarmColumns.explanation'),
    required: true,
    field: 'explanation',
    align: 'center' as const,
  },
]

const rows = computed(() => {
  return props.alarms
    .filter((alarm) => {
      if (settingStore.showAllAlarms) {
        return true
      }
      const alarmTypeIncluded = !alarm.alarmType || settingStore.alarmSettings.includes(alarm.alarmType)
      if (alarmTypeIncluded) {
        if (props.selectedTime > new Date(alarm.startTime) && (alarm.endTime ? new Date(alarm.endTime) > props.selectedTime : 1))
          return true
      }
      return false
    })
    .map((alarm) => {
      const startTime = d(new Date(alarm.startTime), 'datetime', 'tr')
      const endTime = alarm.endTime ? d(new Date(alarm.endTime), 'datetime', 'tr') : ''

      const durationMs = new Date(alarm.endTime || '').getTime() - new Date(alarm.startTime).getTime()
      const duration = durationMs > 0 ? formatDuration(durationMs / 1000) : 'N/A'

      return {
        startTime,
        endTime,
        duration,
        explanation: alarm.explanation,
        originalStartTime: alarm.startTime,
      }
    })
})
</script>

<template>
  <div class="wh-full overflow-y-auto text-xs h-full container">
    <!-- Checkbox for select all -->
    <div class="pos-relative">
      <q-checkbox
        :model-value="settingStore.showAllAlarms"
        class="pos-absolute top-0 left-0 ml-5 z-1"
        right-label
        :label="checkLabel"
        @update:model-value="newVal => settingStore.setShowAllAlarms(newVal)"
      />
    </div>

    <!-- Settings button -->
    <div class="pos-relative">
      <div class="pos-absolute top-0 right-0 mr-4 z-1">
        <q-btn
          flat
          icon="settings"
          @click="toggleAlarmsettings"
        />
      </div>
    </div>
    <!-- Table for alarms -->
    <q-table
      flat
      bordered
      dense
      :pagination="{ rowsPerPage: 0 }"
      :rows="rows"
      :no-data-label="t('noAlarm')"
      :columns="columns"
      row-key="batchAlarmNo"
      class="text-black table-custom my-auto mt-10 ml-4 mr-4"
      @row-click="handleRowClick"
    />
  </div>
</template>

<style scoped>
.q-table__card {
  background-color: transparent;
}
.table-custom :deep(td) {
  font-size: inherit;
}
.table-custom :deep(th) {
  font-size: inherit;
}
</style>
