<script setup lang="ts">
import { matChevronLeft, matChevronRight } from '@quasar/extras/material-icons'

const { data: distinctErpParameters } = useFetch('/api/settings/erpParameters/distinctErpParameters')
const selected = ref()
const unplannedParameters = reactive([] as { paramName: string }[])

function addParameter() {
  if (!unplannedParameters.includes(selected.value)) {
    const index = distinctErpParameters.value.indexOf(selected.value)
    distinctErpParameters.value.splice(index, 1)
    unplannedParameters.push(selected.value)
  }
}
function removeParameter() {
  const index = unplannedParameters.indexOf(selected.value)
  if (index !== -1) {
    distinctErpParameters.value?.push(selected.value)
    unplannedParameters.splice(index, 1)
  }
}
</script>

<template>
  <div class="h-80vh unplanned-wrapper">
    <q-list dense bordered separator class="max-h-80vh overflow-auto">
      <q-item
        v-for="(item, idx) in distinctErpParameters"
        :key="idx"
        v-ripple
        clickable
        :active="selected === item"
        active-class="bg-primary text-white"
        @click="selected = item"
      >
        <q-item-section>
          {{ item.paramName }}
        </q-item-section>
      </q-item>
    </q-list>
    <div class="flex-center flex-col gap-10 w-full h-full">
      <q-btn color="primary" :icon-right="matChevronRight" @click="addParameter" />
      <q-btn color="primary" :icon="matChevronLeft" @click="removeParameter()" />
    </div>
    <div>
      <q-list dense bordered separator class="max-h-80vh overflow-auto h-full">
        <q-item
          v-for="(item, idy) in unplannedParameters" :key="idy"
          v-ripple
          clickable
          :active="selected === item"
          active-class="bg-primary text-white"
          @click="selected = item"
        >
          <q-item-section>
            {{ item.paramName }}
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
