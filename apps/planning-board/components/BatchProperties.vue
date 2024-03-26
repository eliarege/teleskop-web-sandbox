<script setup lang="ts">
import { addSeconds, differenceInHours, differenceInMilliseconds, differenceInMinutes, differenceInSeconds, formatDuration } from 'date-fns'

const props = defineProps<{ machineId: number, jobOrder: string, planKey: number }>()
const colors = reactive({
  activeBackGround: '#4B5563',
  backGround: '#4B5563',
  idleBackGround: '#D1D5DB',
  itemBackGround: '#000000',
})
const { data: machine } = await useFetch('/api/machineList', {
  query: { machineId: props.machineId },
})
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
      endTime = addSeconds(startTime, batchProperties.value?.times.theoreticalDuration)
    }
    elapsedTime = differenceInMilliseconds(new Date(), startTime)
    elapsedTime = useDateFormat(elapsedTime, 'HH:mm:ss')

    return [
      {
        label: `Theoretical Duration: ${batchProperties.value?.times.theoreticalDuration}`,
      },
      {
        label: `Start Time: ${useDateFormat(new Date(startTime), 'YYYY-MM-DD HH:mm:ss').value}`,
      },
      {
        label: `End Time: ${useDateFormat(endTime, 'YYYY-MM-DD HH:mm:ss').value}`,
      },
      {
        label: `Elapsed Time: ${elapsedTime.value}`,
      },
    ]
  } else {
    return [
      {
        label: `Theoretical Duration: ${batchProperties.value?.times.theoreticalDuration}`,
      },
      {
        label: `Theoretical Start Time: ${useDateFormat(new Date(batchProperties.value?.times.plannedStartTime || ''), 'YYYY-MM-DD HH:mm:ss').value}`,
      },
    ]
  }
})

const summary = computed(() => {
  return [
    {
      label: `Plan Key: ${batchProperties.value?.summary.planKey}`,
    },
    {
      label: `Fabric Weight: ${batchProperties.value?.summary.value}`,
    },
  ]
})
const tree = reactive([
  {
    label: 'ERP Parametereleri',
    fold: true,
    children: batchProperties.value?.erpParameters.map(e => ({
      label: `${e.paramName}: ${e.value}`,
    })),
  },
  {
    label: 'Süreler',
    fold: true,
    children: time.value,
  },
  {
    label: 'Programlar',
    fold: true,
    children: batchProperties.value?.programs.map((program, i) => ({
      label: ` ${i + 1} -> ${program.NAME}`,
    })),
  },
  {
    label: 'Özet',
    fold: true,
    children: summary.value,
  },
])

const currentMachine = computed(() => machine.value?.find(a => a.id === props.machineId))
const tab = ref('planParameter')
function cardBackgroundColor(currentAlarmStatus: number, runningBatchStatus: number) {
  if (currentAlarmStatus === 0) {
    return '#FF3030'
  } else if (currentAlarmStatus === 1) {
    return '#FFA730'
  }
  if (runningBatchStatus !== 2) {
    return colors.idleBackGround
  } else return colors.activeBackGround
}
</script>

<template>
  <div class="batch-wrapper">
    <div class="side-bar border-solid border-1px p-1 rounded-2xl border-gray-500/50">
      <MachineCardMain
        class="!h-270px"
        :colors="{
          backGround: cardBackgroundColor(currentMachine!.currentAlarmStatus, currentMachine!.runningBatchStatus),
          itemBackGround: colors.itemBackGround,
          activeBackGround: colors.activeBackGround,
          idleBackGround: colors.idleBackGround,
        }"
        :is-group-visible="true"
        :is-screen-viable="false"
        :washing="false"
        :machine-sort="1"
        :machine="currentMachine || []"
        :links-active="false"
      />
      <div class="w-full h-min max-h-140 overflow-auto p-3 !font-100 border-1px border-gray-500/50 rounded">
        <div v-for="(item, idx) in tree" :key="idx" class="flex-center w-full">
          <q-expansion-item v-model="item.fold" header-class="font-extrabold" class="w-full max-w-100" :label="item.label" expand-seperator>
            <q-list v-for="(test, idy) in item.children" :key="idy">
              <q-item>
                <q-item-section>
                  {{ test.label }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </div>
      </div>
    </div>
    <div class=" border-solid border-1px p-1 rounded-2xl border-gray-500/50">
      <q-tabs
        v-model="tab"
        ripple="false"
      >
        <q-tab name="planParameter" label="Plan Parametreleri" />
        <q-tab name="recipe" label="Reçete" />
      </q-tabs>

      <q-separator />

      <q-tab-panels
        v-model="tab"
        animated
        class="max-h-90vh overflow-auto"
      >
        <q-tab-panel name="planParameter">
          <PlanParameters :plan-key="planKey" />
        </q-tab-panel>
        <q-tab-panel name="recipe">
          <PlanRecipe :job-order="jobOrder" :machine-id="machineId" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.batch-wrapper {
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 2fr;
    justify-content: center;
    @apply grid font-extrabold bg-white gap-5 h-98vh cursor-default p-2;
  .side-bar{
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 2fr;
    @apply grid font-extrabold gap-3;
    }
}
</style>
