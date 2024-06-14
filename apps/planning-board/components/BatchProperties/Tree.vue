<script setup lang="ts">
import { addSeconds, differenceInMilliseconds } from 'date-fns'

const props = defineProps<{ machineId: number, planKey: number, theoreticalDuration: number, fabricWeight: number | string }>()
const { t } = useI18n()

const { data: batchProperties } = await useFetch('/api/batchProperties', {
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
        label: `${t('time.theoretical-duration')}: ${props.theoreticalDuration}`,
      },
      {
        label: `${t('time.start-time')}: ${useDateFormat(new Date(startTime), 'YYYY-MM-DD HH:mm:ss').value}`,
      },
      {
        label: `${t('time.end-time')}: ${useDateFormat(endTime, 'YYYY-MM-DD HH:mm:ss').value}`,
      },
      {
        label: `${t('time.elapsed-time')}: ${elapsedTime.value}`,
      },
    ]
  } else {
    return [
      {
        label: `${t('time.theoretical-duration')}: ${props.theoreticalDuration}`,
      },
      {
        label: `${t('time.theoretical-start-time')}: ${useDateFormat(new Date(batchProperties.value?.times.plannedStartTime || ''), 'YYYY-MM-DD HH:mm:ss').value}`,
      },
    ]
  }
})

const summary = computed(() => {
  return [
    {
      label: `${t('summary.plan-key')}: ${props.planKey}`,
    },
    {
      label: `${t('summary.fabric-weight')}: ${props.fabricWeight}`,
    },
  ]
})

const tree = reactive([
  {
    label: t('tree.erp-params'),
    fold: true,
    children: batchProperties.value?.erpParameters.map(e => ({
      label: `${e.paramName}: ${e.value}`,
    })),
  },
  {
    label: t('tree.time'),
    fold: true,
    children: time.value,
  },
  {
    label: t('tree.programs'),
    fold: true,
    children: batchProperties.value?.programs.map((program, i) => ({
      label: ` ${i + 1} ${program.NAME}`,
    })),
  },
  {
    label: t('tree.summary'),
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

<style scoped lang="postcss">
</style>

<i18n lang="json">
  {
    "en": {
      "time": {
        "theoretical-duration": "Theoretical Duration",
        "start-time": "Start Time",
        "theoretical-start-time": "Theoretical Start Time",
        "end-time": "End Time",
        "elapsed-time": "Elapsed Time"
      },
      "summary": {
        "plan-key": "Plan Key",
        "fabric-weight": "Fabric Weight"
      },
      "tree": {
        "erp-params": "ERP Parameters",
        "time": "Times",
        "programs": "Programs",
        "summary": "Summary"
      }
    },
    "tr": {
      "time": {
        "theoretical-duration": "Teorik Süre",
        "start-time": "Başlangıç Saati",
        "theoretical-start-time": "Teorik Başlangıç Saati",
        "end-time": "Bitiş Saati",
        "elapsed-time": "Geçen Süre"
      },
      "summary": {
        "plan-key": "Plan No",
        "fabric-weight": "Kumaş Ağırlığı"
      },
      "tree": {
        "erp-params": "ERP Parametreleri",
        "time": "Süreler",
        "programs": "Programlar",
        "summary": "Özet"
      }
    }
  }
  </i18n>
