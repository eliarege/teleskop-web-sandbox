<script setup lang="ts">
import type { SortableEvent } from 'sortablejs'
import { Sortable } from 'sortablejs-vue3'
import type { MachineStatus } from '~/shared/types'
import { useSettingStore } from '~/store/settings'

const props = defineProps<{
  machines: MachineStatus[]
}>()
const emit = defineEmits(['updateScheduler'])
const store = useSettingStore()
const sortableMachines = ref([] as { name: string, index: number }[])

watch(() => props.machines, (machines) => {
  // Add missing machine id's
  for (const machine of machines) {
    if (!store.machineOrdering.includes(machine.id)) {
      store.machineOrdering.push(machine.id)
    }
  }

  // Create the array for Sortable component
  sortableMachines.value = machines.map((machine) => {
    return {
      index: store.machineOrdering.indexOf(machine.id),
      name: machine.name,
    }
  }).sort((a, b) => {
    return a.index - b.index
  })
}, { immediate: true })

function isDef<T>(value: T): value is Exclude<T, null | undefined> {
  return value != null
}

function moveItem<T>(array: T[], from: number, to: number) {
  const item = array.splice(from, 1)[0]
  array.splice(to, 0, item)
}

function onEnd(ev: SortableEvent) {
  if (isDef(ev.oldIndex) && isDef(ev.newIndex)) {
    moveItem(store.machineOrdering, ev.oldIndex!, ev.newIndex)
    nextTick(() => emit('updateScheduler'))
  }
}
</script>

<template>
  <div class="w-full max-h-200 p-5 overflow-auto border border-3 border-gray-600 rounded z-100 bg-white items-center">
    <Sortable
      tag="div"
      :list="sortableMachines"
      item-key="id"
      class="w-full"
      :options="{
        animation: 150,
        ghostClass: 'bg-blue-2',
      }"
      @end="(ev) => onEnd(ev)"
    >
      <template #item="{ element }">
        <div class="w-full h-full flex justify-start items-center whitespace-nowrap p-1 border-1px border-gray-500/50 rounded m-1 hover:(bg-blue-3 text-white)">
          <TeleskopIcon name="i-ic-twotone-list" />
          {{ element.name }}
        </div>
      </template>
    </Sortable>
  </div>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
</style>
