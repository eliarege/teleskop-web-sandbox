<script setup lang="ts">
import { addSeconds, differenceInMilliseconds, differenceInSeconds, format } from 'date-fns'
import type { QTableColumn } from 'quasar'
import { formatSeconds } from '../../composables/helper'

const props = defineProps<{
  eventType: 'planned' | 'finished' | 'ongoing' | 'manual' | 'stop' | 'unplanned'
  machineId: number
  planKey: number
  theoreticalDuration: number
  fabricWeight: number | string
  realDuration: number
  deviation: number
}>()
const { t } = useI18n()

const { data: batchProperties } = await useAuthFetch('/api/batchProperties', {
  query: { machineId: props.machineId, planKey: props.planKey },
})

function formatDatetime(date: string | Date | number) {
  return format(date, 'yyyy-MM-dd HH:mm:ss')
}

const deviation = computed(() => {
  if (props.deviation)
    return formatSeconds(props.deviation)
  else
    return '00:00:00'
})

const time = computed(() => {
  if (batchProperties.value?.times.startTime) {
    const startTime = batchProperties.value?.times.startTime
    let endTime: Date | string
    let elapsedTime
    if (batchProperties.value?.times.endTime) {
      endTime = batchProperties.value.times.endTime
      elapsedTime = differenceInSeconds(endTime, startTime)
    } else {
      endTime = addSeconds(startTime, props.theoreticalDuration)
      elapsedTime = differenceInSeconds(new Date(), startTime)
    }

    return [
      {
        label: `${t('batch-properties.time.theoretical-duration')}: ${formatSeconds(props.theoreticalDuration)}`,
      },
      {
        label: `${t('batch-properties.time.real-duration')}: ${props.realDuration ? formatSeconds(props.realDuration) : '00:00:00'}`,
      },
      {
        label: `${t('batch-properties.time.deviation')}: ${deviation.value}`,
      },
      {
        label: `${t('batch-properties.time.start-time')}: ${formatDatetime(startTime)}`,
      },
      {
        label: `${t('batch-properties.time.end-time')}: ${formatDatetime(endTime)}`,
      },
      {
        label: `${t('batch-properties.time.elapsed-time')}: ${formatSeconds(elapsedTime)}`,
      },
    ]
  } else {
    return [
      {
        label: `${t('batch-properties.time.theoretical-duration')}: ${props.theoreticalDuration}`,
      },
      { /* eslint-disable-next-line prefer-template */
        label: `${t('batch-properties.time.theoretical-start-time')}: `
        + formatDatetime(
          batchProperties.value?.times.plannedStartTime
            ? new Date(batchProperties.value.times.plannedStartTime)
            : new Date(),
        ),
      },
    ]
  }
})

const validEventTypes = ['finished', 'ongoing', 'manual']

function formatDeviation(actualDuration: number, theoreticalDuration: number) {
  if (!validEventTypes.includes(props.eventType)) {
    return 0
  }
  if (!actualDuration) {
    return '00:00:00'
  }
  const val = actualDuration - theoreticalDuration
  return val < 0
    ? `-${formatSeconds(Math.abs(val))}`
    : formatSeconds(val)
}

function cellColor(data: {
  prgNo: number
  prgName: string
  theoreticalDuration: number
  actualDuration: number
  currentlyRunning: boolean
}): string {
  if (!validEventTypes.includes(props.eventType)) {
    return 'white'
  }

  const deviation = data.actualDuration - data.theoreticalDuration
  if (!data.actualDuration) {
    return 'white'
  }
  if (data.currentlyRunning)
    return '#0951C0'
  if (deviation === 0)
    return '#1E5D18'
  if (deviation > 0)
    return '#C02A15'
  if (deviation < 0)
    return '#A7D1DF'
  return 'white'
}

function formatActualDuration(actualDuration?: number) {
  if (!validEventTypes.includes(props.eventType)) {
    return '00:00:00'
  }

  return actualDuration ? formatSeconds(actualDuration) : '00:00:00'
}
const programs = computed(() => batchProperties.value?.programs.map(p => ({
  ...p,
  prgNo: p.currentlyRunning ? `>>${p.prgNo}` : p.prgNo,
  theoreticalDuration: formatSeconds(p.theoreticalDuration),
  actualDuration: formatActualDuration(p.actualDuration),
  deviation: formatDeviation(p.actualDuration, p.theoreticalDuration),
  color: cellColor(p),
})))

const programColumns = reactive([
  { label: t('plan-recipe.program-no'), name: 'prgNo', field: 'prgNo', align: 'center' },
  { label: t('plan-recipe.program'), name: 'prgName', field: 'prgName', align: 'center' },
  { label: t('plan-recipe.theoretical-duration'), name: 'theoreticalDuration', field: 'theoreticalDuration', align: 'center' },
  { label: t('plan-recipe.actual-duration'), name: 'actualDuration', field: 'actualDuration', align: 'center' },
  { label: t('plan-recipe.deviation'), name: 'deviation', field: 'deviation', align: 'center' },
] as QTableColumn[])
const summary = computed(() => {
  return [
    {
      label: `${t('batch-properties.summary.plan-key')}: ${props.planKey}`,
    },
    {
      label: `${t('batch-properties.summary.fabric-weight')}: ${props.fabricWeight}`,
    },
  ]
})
const items = [
  {
    label: t('legend.early'),
    color: '#A7D1DF',
  },
  {
    label: t('legend.ontime'),
    color: '#1E5D18',
  },
  {
    label: t('legend.late'),
    color: '#C02A15',
  },
  {
    label: t('legend.ongoing'),
    color: '#0951C0',
  },
]
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <!-- ERP Parametreleri -->
    <q-expansion-item
      :label="t('batch-properties.tree.erp-params')"
      header-class="font-extrabold text-l"
      dense
      fold
      expand-seperator
      class="w-full"
    >
      <q-list dense>
        <q-item
          v-for="(item, idx) in batchProperties?.erpParameters"
          :key="idx"
          class="border-b-1 first:border-t-1"
        >
          <q-item-section class="pl-3 text-s">
            {{ item.paramName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <!-- Süreler -->

    <q-expansion-item
      :label="t('batch-properties.tree.time')"
      header-class="font-extrabold text-l"
      dense
      fold
      expand-seperator
      class="w-full"
    >
      <q-list dense>
        <q-item
          v-for="(item, idx) in time"
          :key="idx"
          class="border-b-1 first:border-t-1"
        >
          <q-item-section class="pl-3 text-s">
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>

    <!-- Programlar -->
    <q-expansion-item
      dense
      :label="t('batch-properties.tree.programs')"
      header-class="font-extrabold text-l"
      fold
      expand-seperator
    >
      <div class="!max-h-70 !overflow-auto">
        <BatchPropertiesLegend :items />
        <TeleskopTable
          row-colors
          :columns="programColumns"
          :data="programs"
          :merge-cells-active="false"
          align="center"
        />
      </div>
    </q-expansion-item>

    <!-- Özet -->

    <q-expansion-item
      :label="t('batch-properties.tree.summary')"
      header-class="font-extrabold text-l"
      dense
      fold
      expand-seperator
      class="w-full"
    >
      <q-list dense>
        <q-item
          v-for="(item, idx) in summary"
          :key="idx"
          class="border-b-1 first:border-t-1"
        >
          <q-item-section class="pl-3 text-s">
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>
    <q-space />
  </div>
</template>

<style scoped lang="postcss"></style>
