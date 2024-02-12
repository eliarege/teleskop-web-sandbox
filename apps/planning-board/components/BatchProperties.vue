<script setup lang="ts">
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
const { data: erpParams } = await useFetch('/api/tootlipParameters', {
  query: { machineId: props.machineId, planKey: props.planKey },
})
const tree = computed(() => [
  {
    label: 'ERP Parametereleri',
    children: erpParams.value.map(e => ({
      label: `${e.paramString}: ${e.value}`,
    })),
  },
  {
    label: 'Süreler',
    children: erpParams.value.map(e => ({
      label: `${e.paramString}: ${e.value}`,
    })),
  },
  {
    label: 'Programlar',
    children: erpParams.value.map(e => ({
      label: `${e.paramString}: ${e.value}`,
    })),
  },
  {
    label: 'Özet',
    children: erpParams.value.map(e => ({
      label: `${e.paramString}: ${e.value}`,
    })),
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
      <MachineCard
        class="!h-270px"
        :colors="{
          backGround: cardBackgroundColor(currentMachine!.currentAlarmStatus, currentMachine!.runningBatchStatus),
          itemBackGround: colors.itemBackGround,
          activeBackGround: colors.activeBackGround,
          idleBackGround: colors.idleBackGround,
        }"
        :is-group-visible="true"
        :is-screen-viable="false"
        machine-settings="0"
        :machine-sort="1"
        :machine="currentMachine || []"
        :links-active="false"
      />
      <div class="w-full h-full max-h-147 overflow-auto p-3">
        <QTree
          :nodes="tree"
          node-key="label"
          dense
          label-key="label"
          no-connectors
        />
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
