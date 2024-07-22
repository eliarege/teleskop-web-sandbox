<script setup lang="ts">
import type { PlanParameters } from '~/shared/types'

interface PlanParameterProps {
  planKey: number
  isBatchStarted: boolean
  machineId: number
  missingParams: PlanParameters[]
  isSendMachine: boolean
}

const props = defineProps<PlanParameterProps>()
const { data: planParameters } = useFetch('/api/planParameters', {
  default: () => [],
  query: { planKey: props.planKey, machineId: props.machineId },
})
const modifiedParameters = computed(() => [...planParameters.value, ...props.missingParams].sort((a, b) => a.paramStatus > b.paramStatus ? 1 : -1))
</script>

<template>
  <div class="w-full h-full">
    <PlanParametersTable
      :parameter-data="modifiedParameters"
      :machine-id
      :editable="!isBatchStarted"
      :is-send-machine
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
