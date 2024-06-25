<script setup lang="ts">
const props = defineProps<{ machineId: number, jobOrder: string, planKey: number, fabricWeight: number | string, theoreticalDuration: number }>()

const colors = reactive({
  activeBackGround: '#4B5563',
  backGround: '#4B5563',
  idleBackGround: '#D1D5DB',
  itemBackGround: '#000000',
})

const { data: machine } = await useFetch('/api/machineList')
const currentMachine = computed(() => machine.value?.find(a => a.id === props.machineId))

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
    <div class="side-bar">
      <MachineCardMain
        class="!h-270px max-w-29rem font-extrabold"
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

      <q-separator spaced inset />

      <div class="w-full h-min max-h-140 overflow-auto p-3 divide-y-2">
        <BatchPropertiesTree
          :machine-id
          :plan-key
          :theoretical-duration
          :fabric-weight
        />
      </div>
    </div>
    <div class="w-full h-full overflow-auto border-solid border-1px p-1 rounded-2xl border-gray-500/50">
      <BatchPropertiesPanel
        :machine-id
        :job-order
        :plan-key
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.batch-wrapper {
    grid-template-rows: 1fr;
    grid-template-columns: 1fr 2fr;
    justify-content: center;
    @apply grid bg-white gap-5 h-98vh cursor-default p-2 rounded;

  .side-bar{
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 16px 2fr;
    @apply grid gap-3 justify-items-center border-solid border-1px rounded-2xl border-gray-500/50 max-w-30rem p-2;
    }
}
</style>
