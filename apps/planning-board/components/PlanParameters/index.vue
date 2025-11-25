<script setup lang="ts">
import type { PlanParameterProps } from '~/shared/types'

const props = defineProps<PlanParameterProps>()
const emit = defineEmits(['uploadMachine'])
const { data: planParameters, refresh: planParameterRefresh } = useAuthFetch('/api/planParameters', {
  default: () => [],
  immediate: false,
  query: { planKey: props.planKey, machineId: props.machineId },
})
if (!props.isSendMachine) {
  planParameterRefresh()
}
const modifiedParameters = computed(() =>
  planParameters.value.toSorted((a, b) => a.paramStatus > b.paramStatus ? 1 : -1),
)
</script>

<template>
  <div class="w-full h-full">
    <PlanParametersTable
      :plan-key="props.planKey"
      :parameter-data="modifiedParameters"
      :machine-id
      :editable="!isBatchStarted"
      :is-send-machine
      :machine-upload-data="uploadData"
      @upload-machine="(ev) => emit('uploadMachine', ev)"
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
