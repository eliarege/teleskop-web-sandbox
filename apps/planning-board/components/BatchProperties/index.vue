<script setup lang="ts">
import type { PlanParameterProps } from '~/shared/types'

const props = defineProps<{
  machineId: number
  jobOrder: string
  planKey: number
  fabricWeight: number | string
  theoreticalDuration: number
  planParameters: PlanParameterProps
  realDuration: number
  deviation: number
}>()
const colors = reactive({
  activeBackGround: '#4B5563',
  backGround: '#4B5563',
  idleBackGround: '#D1D5DB',
  itemBackGround: '#000000',
})

const { data: machine } = await useAuthFetch('/api/machineList')
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
  <div class="bg-white cursor-default grid grid-cols-[0.5fr_1fr] gap-4 w-80vw h-98vh max-h-98vh overflow-auto">
    <div class="w-full h-full bg-white min-w-29rem">
      <MachineCardMain
        class="!h-270px !font-extrabold"
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

      <div>
        <BatchPropertiesTree
          :machine-id
          :plan-key
          :theoretical-duration
          :fabric-weight
          :real-duration
          :deviation
        />
      </div>
    </div>
    <div>
      <BatchPropertiesPanel
        :plan-parameters
        :machine-id
        :job-order
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
