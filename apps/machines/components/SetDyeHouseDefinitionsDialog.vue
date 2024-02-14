<script setup lang="ts">
const props = defineProps<{
  show: boolean
  selected: Machine
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

const options = ref({
  users: false,
  manualReasons: false,
  machineIdleReasons: false,
  machineFinishReasons: false,
  commandTimeoutReasons: false,
})

async function setDefinitions() {
  await $fetch('/api/sync/upload-dye-house-definitions', {
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
</script>

<template>
  <q-dialog :model-value="show" @hide="emit('close')">
    <q-card class="p-8">
      <h3 class="flex justify-center mb-4">
        {{ t('setDyeHouseDefinitions') }}
      </h3>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <q-checkbox v-model="options.users" :label="t('users')" />
        <q-checkbox v-model="options.manualReasons" :label="t('manualReasons')" />
        <q-checkbox v-model="options.machineIdleReasons" :label="t('machineIdleReasons')" />
        <q-checkbox v-model="options.machineFinishReasons" :label="t('machineFinishReasons')" />
        <q-checkbox v-model="options.commandTimeoutReasons" :label="t('commandTimeoutReasons')" />
      </div>
      <div class="flex flex-row gap-4 justify-end">
        <q-btn no-caps :label="t('selectAll')" @click="selectAll" />
        <q-btn no-caps :label="t('deselectAll')" @click="deselectAll" />
        <q-btn no-caps :label="t('cancel')" @click="emit('close')" />
        <q-btn no-caps :label="t('send')" @click="setDefinitions" />
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped>

</style>
