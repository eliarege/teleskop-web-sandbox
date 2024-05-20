<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { Sortable } from 'sortablejs-vue3'
import { useSettingStore } from '~/store/settings'

const emit = defineEmits(['updateScheduler'])
const store = useSettingStore()
const machineSettings = useStorage('machine-sort', store.machines)

function moveItem<T>(array: T[], from: number, to: number) {
  const item = array.splice(from, 1)[0]
  // nextTick(() => array.splice(to, 0, item))
  array.splice(to, 0, item)
}

function onEnd(ev) {
  moveItem(store.machines, ev.oldIndex, ev.newIndex)
  emit('updateScheduler')
}
</script>

<template>
  <div class="w-full max-h-200 p-5 overflow-auto border border-3 border-gray-600 rounded z-100 bg-white items-center">
    <Sortable
      tag="div"
      :list="machineSettings"
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
          <Icon name="ic:twotone-list" size="30" />
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
