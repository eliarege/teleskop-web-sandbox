<script setup lang="ts">
import { addSeconds, differenceInMilliseconds, toDate } from 'date-fns'
import type { QTableColumn } from 'quasar'

const props = defineProps<{ machineId: number, planKey: number, theoreticalDuration: number, fabricWeight: number | string, realDuration: number, deviation: number }>()
const { t } = useI18n()

const { data: batchProperties } = await useAuthFetch('/api/batchProperties', {
  query: { machineId: props.machineId, planKey: props.planKey },
})

const deviation = computed(() => {
  if (props.deviation) {
    const deviationStr = String(props.deviation)
    return deviationStr.startsWith('-') ? `-${formatSeconds(props.deviation)}` : formatSeconds(props.deviation)
  } else return '00:00:00'
})
const time = computed(() => {
  if (batchProperties.value?.times.startTime) {
    const startTime = batchProperties.value?.times.startTime
    let endTime
    let elapsedTime
    if (batchProperties.value?.times.endTime) {
      endTime = batchProperties.value.times.endTime
      elapsedTime = differenceInMilliseconds(endTime, startTime)
    } else {
      endTime = addSeconds(startTime, props.theoreticalDuration)
    }
    elapsedTime = differenceInMilliseconds(new Date(), startTime)
    elapsedTime = useDateFormat(elapsedTime, 'HH:mm:ss')

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
        label: `${t('batch-properties.time.start-time')}: ${useDateFormat(new Date(startTime), 'YYYY-MM-DD HH:mm:ss').value}`,
      },
      {
        label: `${t('batch-properties.time.end-time')}: ${useDateFormat(endTime, 'YYYY-MM-DD HH:mm:ss').value}`,
      },
      {
        label: `${t('batch-properties.time.elapsed-time')}: ${elapsedTime.value}`,
      },
    ]
  } else {
    return [
      {
        label: `${t('batch-properties.time.theoretical-duration')}: ${props.theoreticalDuration}`,
      },
      {
        label: `${t('batch-properties.time.theoretical-start-time')}: ${useDateFormat(new Date(batchProperties.value?.times.plannedStartTime || ''), 'YYYY-MM-DD HH:mm:ss').value}`,
      },
    ]
  }
})
const programs = computed(() => batchProperties.value?.programs.map(p => ({
  ...p,
  prgNo: p.currentlyRunning ? `>>${p.prgNo}` : p.prgNo,
  theoreticalDuration: formatSeconds(p.theoreticalDuration),
  actualDuration: p.actualDuration ? formatSeconds(p.actualDuration) : '00:00:00',
})))
const programColumns = reactive([
  { label: t('plan-recipe.program-no'), name: 'prgNo', field: 'prgNo', align: 'center' },
  { label: t('plan-recipe.program'), name: 'prgName', field: 'prgName', align: 'center' },
  { label: t('plan-recipe.theoretical-duration'), name: 'theoreticalDuration', field: 'theoreticalDuration', align: 'center' },
  { label: t('plan-recipe.actual-duration'), name: 'actualDuration', field: 'actualDuration', align: 'center' },
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
</script>

<template>
  <div class="w-full flx-center flex-col">
    <!-- ERP Parametreleri -->
    <q-expansion-item
      :label="t('batch-properties.tree.erp-params')"
      header-class="font-extrabold text-l"
      fold
      expand-seperator
      class="w-full"
    >
      <q-list v-for="(item, idx) in batchProperties?.erpParameters" :key="idx">
        <q-item>
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
      fold
      expand-seperator
      class="w-full"
    >
      <q-list v-for="(item, idx) in time" :key="idx">
        <q-item>
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
        <TeleskopTable
          dense
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
      fold
      expand-seperator
      class="w-full"
    >
      <q-list v-for="(item, idx) in summary" :key="idx">
        <q-item>
          <q-item-section class="pl-3 text-s">
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>
  </div>
</template>

<style scoped lang="postcss"></style>
