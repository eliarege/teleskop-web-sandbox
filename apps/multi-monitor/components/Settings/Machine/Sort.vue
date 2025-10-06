<script setup lang="ts">
import type { SortableEvent } from 'sortablejs'
import { Sortable } from 'sortablejs-vue3'
import { MachineSort } from '~/shared/constants'
import type { MachineDataRaw } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const props = defineProps<{
  machines: MachineDataRaw[]
}>()
const emit = defineEmits(['updateScheduler'])

const { t } = useI18n()
const store = useDataStore()

const sortableMachines = ref([] as { name: string, index: number, id: number }[])

const compareById = (a: { id: number }, b: { id: number }) => a.id - b.id

const sortedMachines = computed(() => {
  const machines = props.machines
  const activeMachines = machines.filter(machine => machine.runningBatchStatus !== 0)
  const inactiveMachines = machines.filter(machine => machine.runningBatchStatus === 0)
  const customSort = store.customSort
  const order = new Map(customSort.map((id, i) => [id, i]))

  switch (store.sortMachines) {
    case MachineSort.ById:
      return machines.sort(compareById)
    case MachineSort.ByActive:
      return [
        ...activeMachines.sort(compareById),
        ...inactiveMachines.sort(compareById),
      ]
    case MachineSort.ByIdle:
      return [
        ...inactiveMachines.sort(compareById),
        ...activeMachines.sort(compareById),
      ]
    case MachineSort.ByGroup:
      return machines.sort((a, b) =>
        a.groupName < b.groupName ? -1 : (a.groupName > b.groupName ? 1 : 0),
      )
    case MachineSort.ByCustom:
      return machines.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    default:
      return machines
  }
})

watch(() => sortedMachines.value, (machines) => {
  // Add missing machine id's to customSort
  for (const machine of machines) {
    if (!store.customSort.includes(machine.id)) {
      store.customSort.push(machine.id)
    }
  }

  // Create the array for Sortable component based on sorted machines
  sortableMachines.value = machines.map((machine) => {
    return {
      index: store.customSort.indexOf(machine.id),
      name: machine.name,
      id: machine.id,
    }
  })
}, { immediate: true })

function isDef<T>(value: T): value is Exclude<T, null | undefined> {
  return value != null
}

function moveItem<T>(array: T[], from: number, to: number) {
  const item = array.splice(from, 1)[0]
  array.splice(to, 0, item)
}

function onStart() {
  // Set sort to custom when user starts dragging
  store.sortMachines = MachineSort.ByCustom
}

function onEnd(ev: SortableEvent) {
  if (isDef(ev.oldIndex) && isDef(ev.newIndex)) {
    moveItem(store.customSort, ev.oldIndex!, ev.newIndex)
    nextTick(() => emit('updateScheduler'))
  }
}
</script>

<template>
  <div>
    <span class="settings-sub-title inline-block mb-2px">
      {{ t('settings.machine-sort') }}
    </span>
    <Sortable
      tag="div"
      :list="sortableMachines"
      item-key="id"
      class="whitespace-nowrap lg:w-full md:w-1/2 sm:w-1/2 grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-2 md:gap-1 sm:gap-1"
      :options="{
        animation: 150,
        ghostClass: 'ghost',
      }"
      @start="onStart"
      @end="(ev) => onEnd(ev)"
    >
      <template #item="{ element }">
        <div class="w-full h-full flex justify-start items-center gap-1 whitespace-nowrap lg: mg:p-1 p-1 sm:p-2 border-1px border-gray-500/50 rounded m-1 md:m-1 sm:m-0.5 hover:(bg-#4b5563 text-white cursor-pointer) md:text-sm sm:text-xs">
          <TwIcon name="i-ic:twotone-list" class="md:text-base sm:text-sm" />
          <span class="md:inline sm:block sm:truncate">{{ element.name }}</span>
        </div>
      </template>
    </Sortable>
  </div>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #4b5563;
}
</style>
