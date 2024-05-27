<script setup lang="ts">
import type { Machine } from '~/types'

const props = defineProps<{
  show: boolean
  selected: Machine
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

const options = ref<Record<string, boolean>>({
  users: false,
  manualReasons: false,
  machineIdleReasons: false,
  machineFinishReasons: false,
})

async function loadDefinitions() {
  await $fetch('/api/sync/download-dye-house-definitions', {
    method: 'POST',
    body: {
      machineId: props.selected.machineId,
      options: options.value,
    },
  })
}

function selectAll() {
  Object.keys(options.value).forEach((key) => {
    options.value[key] = true
  })
}

function deselectAll() {
  Object.keys(options.value).forEach((key) => {
    options.value[key] = false
  })
}

function reverseSelected() {
  Object.keys(options.value).forEach((key) => {
    options.value[key] = !options.value[key]
  })
}
</script>

<template>
  <q-dialog :model-value="show" @hide="emit('close')">
    <q-card class="p-8 min-w-[1000px]">
      <div class="flex mb-4">
        <h3 class="flex grow justify-center">
          {{ t('getDyeHouseDefinitions') }}
        </h3>
        <q-icon
          name="close"
          class="cursor-pointer"
          size="1.5em"
          @click="$emit('close')"
        />
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <q-checkbox v-model="options.users" :label="t('users')" />
        <q-checkbox v-model="options.manualReasons" :label="t('manualReasons')" />
        <q-checkbox v-model="options.machineIdleReasons" :label="t('machineIdleReasons')" />
        <q-checkbox v-model="options.machineFinishReasons" :label="t('machineFinishReasons')" />
      </div>
      <div class="flex flex-row gap-4 justify-end">
        <q-btn
          no-caps
          :label="t('selectAll')"
          @click="selectAll"
        />
        <q-btn
          no-caps
          :label="t('deselectAll')"
          @click="deselectAll"
        />
        <q-btn
          no-caps
          :label="t('reverseSelected')"
          @click="reverseSelected"
        />
        <q-btn
          no-caps
          :label="t('cancel')"
          @click="emit('close')"
        />
        <q-btn
          no-caps
          :label="t('get')"
          @click="loadDefinitions"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped>

</style>
