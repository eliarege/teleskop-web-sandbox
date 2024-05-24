<script setup lang="ts">
import { matChevronLeft, matChevronRight } from '@quasar/extras/material-icons'

const emit = defineEmits(['addColumn', 'removeColumn'])
const { data: unplannedColumns } = useFetch('/api/unplannedColumns', { default: () => [] })

const selected = ref()

const sort = computed(() => unplannedColumns.value.toSorted((a, b) => a.id > b.id ? 1 : -1))
const visibleColumns = computed(() => sort..filter(a => a.visible === true))
const invisibleColumns = computed(() => sort.value.filter(a => a.visible !== true))

function addParameter() {
  if (sort.value) {
    const index = sort.value.indexOf(selected.value)
    sort.value[index].visible = true
    $fetch('/api/unplannedColumns', {
      method: 'PUT',
      body: { id: selected.value.id, visible: true },
    })
    emit('addColumn', selected.value)
    selected.value = sort.value[index + 1]
  }
}

function removeParameter() {
  if (sort.value) {
    const index = sort.value.indexOf(selected.value)
    sort.value[index].visible = false
    $fetch('/api/unplannedColumns', {
      method: 'PUT',
      body: { id: selected.value.id, visible: false },
    })
    emit('removeColumn', selected.value)
    selected.value = sort.value[index + 1]
  }
}
</script>

<template>
  <div class="h-80vh unplanned-wrapper">
    <q-list dense bordered separator class="max-h-80vh overflow-auto">
      <q-item
        v-for="(item, idx) in invisibleColumns"
        :key="idx"
        v-ripple
        tabindex="0"
        clickable
        :manual-focus="true"
        :focused="selected === item"
        @click="selected = item"
        @focus="selected = item"
      >
        <q-item-section>
          {{ item.parameterName }}
        </q-item-section>
      </q-item>
    </q-list>
    <div class="flex-center flex-col gap-10 w-full h-full">
      <q-btn :disabled="visibleColumns.includes(selected)" color="primary" :icon-right="matChevronRight" @click="addParameter()" />
      <q-btn :disabled="invisibleColumns.includes(selected)" color="primary" :icon="matChevronLeft" @click="removeParameter()" />
    </div>
    <div>
      <q-list dense bordered separator class="max-h-80vh overflow-auto h-full">
        <q-item
          v-for="(item, idy) in visibleColumns" :key="idy"
          v-ripple
          clickable
          tabindex="0"
          :manual-focus="true"
          :focused="selected === item"
          @click="selected = item"
          @focus="selected = item"
        >
          <q-item-section>
            {{ item.parameterName }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.unplanned-wrapper {
  grid-template-columns: 2fr 1fr 2fr;
  @apply grid;
}
</style>
