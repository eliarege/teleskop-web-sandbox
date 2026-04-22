<script setup lang="ts">
import type { BatchParameters } from '~/types/archive'

const props = defineProps<{
  startParameters: BatchParameters[]
  selectedTime: Date
}>()

const batchParametersWithClosestTime = computed(() => {
  const selectedTime = props.selectedTime.getTime()

  return props.startParameters.map((batchParameter) => {
    const closestParamValue
      = batchParameter.paramValues.length > 0
        ? batchParameter.paramValues.reduce((closest, current) => {
          const currentTime = new Date(current.time).getTime()
          const closestTime = new Date(closest.time).getTime()

          const currentDiff = Math.abs(currentTime - selectedTime)
          const closestDiff = Math.abs(closestTime - selectedTime)

          return currentDiff < closestDiff ? current : closest
        })
        : { time: '', value: 0 }

    return {
      ...batchParameter,
      closestParamValue,
    }
  })
})

const formattedRows = computed(() => {
  return batchParametersWithClosestTime.value.map(param => ({
    name: param.name,
    value: param.closestParamValue.value.toFixed(0),
  }))
})
</script>

<template>
  <q-list
    class="wh-full overflow-y-auto bg-white py-2"
    dense
    separator
  >
    <q-item
      v-for="(row, index) in formattedRows"
      :key="index"
    >
      <q-item-section>
        <span class="text-sm">
          {{ row.name }}
        </span>
      </q-item-section>

      <q-item-section side>
        <span class="text-sm">
          {{ row.value }}
        </span>
      </q-item-section>
    </q-item>
  </q-list>
</template>
