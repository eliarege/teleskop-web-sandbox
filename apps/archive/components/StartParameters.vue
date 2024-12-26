<script setup lang="ts">
import type { BatchParameters } from '~/types/archive'

const props = defineProps<{
  startParameters: BatchParameters[]
  selectedTime: Date
}>()

const outerDivRef = ref<HTMLElement | null>(null)
const { t } = useI18n()

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

onMounted(() => {
  if (outerDivRef.value) {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        const newFontSize = `${Math.max(12, width / 50)}px`
        if (outerDivRef.value) {
          outerDivRef.value.style.fontSize = newFontSize
        }
      }
    })
    observer.observe(outerDivRef.value)

    onUnmounted(() => {
      if (outerDivRef.value) {
        observer.unobserve(outerDivRef.value)
      }
    })
  }
})
</script>

<template>
  <div ref="outerDivRef" class="border wh-full overflow-y-auto h-full table-container">
    <table class="table w-full">
      <tbody>
        <tr v-for="(row, index) in formattedRows" :key="index">
          <td class="px-2 py-0.5 text-left">
            {{ row.name }}
          </td>
          <td class="px-2 py-0.5 text-left">
            {{ row.value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table {
  width: 100%;
}

.table td {
  text-align: left;
  font-size: inherit;
  border-bottom: 1px solid grey;
}

.table-container {
  max-height: 100%;
  overflow-y: auto;
  font-size: inherit;
}
</style>
