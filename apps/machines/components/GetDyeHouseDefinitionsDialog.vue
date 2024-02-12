<script setup lang="ts">
const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

const options = ref({
  users: false,
  manualReasons: false,
  machineIdleReasons: false,
  machineFinishReasons: false,
})

async function loadDefinitions() {
  await $fetch('/api/ftp/update-definitions', {
    method: 'POST',
    query: {
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
        {{ t('getDyeHouseDefinitions') }}
      </h3>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <q-checkbox v-model="options.users" label="Users" />
        <q-checkbox v-model="options.manualReasons" label="Manual Reasons" />
        <q-checkbox v-model="options.machineIdleReasons" label="Machine Idle Reasons" />
        <q-checkbox v-model="options.machineFinishReasons" label="Machine Finish Reasons" />
      </div>
      <div class="flex flex-row gap-4 justify-end">
        <q-btn no-caps :label="t('Select All')" @click="selectAll" />
        <q-btn no-caps :label="t('Deselect All')" @click="deselectAll" />
        <q-btn no-caps :label="t('Cancel')" @click="emit('close')" />
        <q-btn no-caps :label="t('Get')" @click="loadDefinitions" />
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped>

</style>
