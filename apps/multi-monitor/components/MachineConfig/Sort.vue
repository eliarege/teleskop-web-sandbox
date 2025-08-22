<script setup lang="ts">
import type { SortableEvent } from 'sortablejs'
import { Sortable } from 'sortablejs-vue3'
import type { MachineDataRaw } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const props = defineProps<{
  machines: MachineDataRaw[]
}>()
const emit = defineEmits(['updateScheduler'])
const store = useDataStore()
const sortableMachines = ref([] as { name: string, index: number }[])

watch(() => props.machines, (machines) => {
  // Add missing machine id's
  for (const machine of machines) {
    if (!store.customSort.includes(machine.id)) {
      store.customSort.push(machine.id)
    }
  }

  // Create the array for Sortable component
  sortableMachines.value = machines.map((machine) => {
    return {
      index: store.customSort.indexOf(machine.id),
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
    moveItem(store.customSort, ev.oldIndex!, ev.newIndex)
    nextTick(() => emit('updateScheduler'))
  }
}
</script>

<template>
  <span>
    Custom Machine Sort
  </span>
  <Sortable
    tag="div"
    :list="sortableMachines"
    item-key="id"
    class="w-full"
    :options="{
      animation: 150,
      ghostClass: 'ghost',
    }"
    @end="(ev) => onEnd(ev)"
  >
    <template #item="{ element }">
      <div class="w-full h-full flex justify-start items-center whitespace-nowrap p-1 border-1px border-gray-500/50 rounded m-1 hover:(bg-#4b5563 text-white)">
        <TwIcon name="i-ic:twotone-list" />
        {{ element.name }}
      </div>
    </template>
  </Sortable>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #4b5563;
}
</style>
