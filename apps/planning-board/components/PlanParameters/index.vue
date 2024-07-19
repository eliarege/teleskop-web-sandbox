<script setup lang="ts">
interface PlanParameterProps {
  planKey: number
  isBatchStarted: boolean
  machineId: number
}

const props = defineProps<PlanParameterProps>()
const { data: planParameters } = useFetch('/api/planParameters', {
  default: () => [],
  query: { planKey: props.planKey, machineId: props.machineId },
})
</script>

<template>
  <div class="w-full h-full">
    <PlanParametersTable :parameter-data="planParameters" :editable="!isBatchStarted" />
  </div>
</template>

<style scoped lang="postcss">
</style>
