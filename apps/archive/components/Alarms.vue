<script setup lang="ts">
import { format } from 'date-fns'
import { alarmTypes } from '~/shared/constants'
import type { BatchAlarm } from '~/types/archive'
import { formatDuration } from '~/utils/functions'

const props = defineProps<{
  alarms: BatchAlarm[]
  selectedTime: Date
}>()

const emit = defineEmits<{
  (e: 'rowClicked', startTime: string): void
}>()

const $q = useQuasar()
const { t } = useI18n()

const alarmOptions = computed(() =>
  alarmTypes.map(a => ({
    label: t(a.label),
    value: a.type,
  })),
)

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

const columns = computed(() => [
  {
    name: 'startTime',
    label: t('alarmColumns.startTime'),
    required: true,
    field: 'startTime',
    align: 'center' as const,
    format: (val: string) =>
      val ? format(new Date(val), 'HH:mm:ss') : '',
  },
  {
    name: 'endTime',
    label: t('alarmColumns.endTime'),
    required: true,
    field: 'endTime',
    align: 'center' as const,
    format: (val: string) =>
      val ? format(new Date(val), 'HH:mm:ss') : '',
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
])

const rows = computed(() => {
  if (!props.alarms)
    return []

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
      const durationMs = new Date(alarm.endTime || '').getTime() - new Date(alarm.startTime).getTime()
      const duration = durationMs > 0 ? formatDuration(durationMs / 1000) : 'N/A'

      return {
        startTime: alarm.startTime,
        endTime: alarm.endTime,
        duration,
        explanation: alarm.explanation,
        originalStartTime: alarm.startTime,
      }
    })
})
</script>

<template>
  <div class="p-1 wh-full bg-white flex flex-col">
    <div class="flex justify-between items-center text-xs mb-1 flex-shrink-0">
      <!-- Checkbox for select all -->
      <div>
        <q-checkbox
          :model-value="settingStore.showAllAlarms"
          :label="checkLabel"
          size="xs"
          dense
          @update:model-value="newVal => settingStore.setShowAllAlarms(newVal)"
        />
      </div>

      <!-- Settings button -->
      <div>
        <q-btn
          flat
          dense
          size="xs"
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
      hide-bottom
      class="alarm-table w-full flex-1 min-h-0"
      table-header-style="position: sticky; top: 0; z-index: 1;"
      table-header-class="bg-gray-1 dark:bg-dark-4"
      @row-click="handleRowClick"
    />
  </div>
</template>

<style scoped>
.alarm-table :deep(th),
.alarm-table :deep(td) {
  font-size: 11px;
}
</style>
