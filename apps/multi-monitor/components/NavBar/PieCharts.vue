<script setup lang="ts">
import type { MachineData } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const props = defineProps<{ machineData: MachineData[] }>()
const { t } = useI18n()

const pieOptions = {
  cornerRadius: 0,
  startAngle: 0,
  padAngle: 0.1,
  innerRadius: 0.5,
  outerRadius: 10,
  endAngle: 10,
  width: 50,
  height: 50,
}

const passiveMachines = computed(
  () => props.machineData.filter(item => item.runningBatchStatus === 0).length,
)

const activeMachines = computed(
  () => props.machineData.length - passiveMachines.value,
)

const inUse = computed(() => {
  return props.machineData
    .map(machine => machine.runningFabricWeight)
    .reduce((sum, val) => Math.round(sum) + Math.round(val), 0)
})
const inActive = computed(() => {
  return props.machineData
    .map(machine => machine.machineCapacity - machine.runningFabricWeight)
    .reduce((sum, val) => Math.round(sum) + Math.round(val), 0)
})
</script>

<template>
  <div class="flex-center whitespace-nowrap gap-9 sm:(text-center) md:(text-center)">
    <div class="flex-center font-extrabold">
      <d-pie
        v-bind="pieOptions"
        :color="['#54C32D', '#F52923']"
        :pie-data="[activeMachines, passiveMachines]"
      />
      <div class="flex-center flex-col">
        <span> {{ t("teleskop.active") }}: {{ activeMachines }}</span>
        <span>{{ t("teleskop.idle") }}: {{ passiveMachines }}</span>
      </div>
    </div>
    <div class="flex-center font-extrabold">
      <d-pie
        v-bind="pieOptions"
        :color="['#1DA7F1', '#8E0000']"
        :pie-data="[inUse, inActive]"
      />
      <div class="flex-center flex-col">
        <span>{{ t("teleskop.in-use") }}: {{ inUse }} (KG)</span>
        <span>{{ t("teleskop.idle") }}: {{ inActive }} (KG)</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
