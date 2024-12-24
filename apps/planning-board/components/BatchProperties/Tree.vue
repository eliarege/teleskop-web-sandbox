<script setup lang="ts">
import { addSeconds, differenceInMilliseconds } from 'date-fns'

const props = defineProps<{ machineId: number, planKey: number, theoreticalDuration: number, fabricWeight: number | string }>()
const { t } = useI18n()

const { data: batchProperties } = await useAuthFetch('/api/batchProperties', {
  query: { machineId: props.machineId, planKey: props.planKey },
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
        label: `${t('batch-properties.time.theoretical-duration')}: ${props.theoreticalDuration}`,
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

const tree = reactive([
  {
    label: t('batch-properties.tree.erp-params'),
    fold: true,
    children: batchProperties.value?.erpParameters.map(e => ({
      label: `${e.paramName}: ${e.value}`,
    })),
  },
  {
    label: t('batch-properties.tree.time'),
    fold: true,
    children: time.value,
  },
  {
    label: t('batch-properties.tree.programs'),
    fold: true,
    children: batchProperties.value?.programs.map((program, i) => ({
      label: ` ${i + 1} ${program.NAME}`,
    })),
  },
  {
    label: t('batch-properties.tree.summary'),
    fold: true,
    children: summary.value,
  },
])
</script>

<template>
  <div
    v-for="(item, idx) in tree"
    :key="idx"
    class="flex-center"
  >
    <q-expansion-item
      v-model="item.fold"
      header-class="font-extrabold text-l"
      class="w-full "
      :label="item.label"
      expand-seperator
    >
      <q-list
        v-for="(child, idy) in item.children"
        :key="idy"
        dense
      >
        <q-item>
          <q-item-section class="pl-3 text-s">
            {{ child.label }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-expansion-item>
  </div>
</template>
