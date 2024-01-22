<script setup lang="ts">
import type { Machine } from '~/types'
import { deleteMachines } from '~/utils'

const props = defineProps<{
  machines: Machine[]
  selected: Machine
}>()

const emit = defineEmits(['deleteMachine', 'addMachine'])

const showNewMachine = ref(false)
const showEditMachine = ref(false)
const showMachineParameters = ref(false)
const showMimic = ref(false)
const showFormulas = ref(false)
const selectedIp = computed(() => props.selected.ip)

const { data: version } = useLazyFetch('/api/soap/get-version', {
  default: () => 0,
  query: {
    ip: selectedIp,
  },
})

async function handleMachineDelete() {
  const machineIds = [props.selected]
  await deleteMachines(machineIds)
  emit('deleteMachine', machineIds)
}

async function loadProject() {
  await $fetch('/api/ftp/update-machine', {
    method: 'GET',
    query: {
      machineId: props.selected.machineId,
      ip: props.selected.ip,
    },
  })
}

async function loadDefinitions() {
  await $fetch('/api/ftp/update-definitions', {
    method: 'GET',
    query: {
      machineId: props.selected.machineId,
      ip: props.selected.ip,
    },
  })
}
</script>

<template>
  <q-card class="flex flex-row justify-between" bordered>
    <q-card-section class="flex items-center">
      <q-btn
        label="Yeni"
        no-caps
        icon="note_add"
        color="primary"
        class="mr-4 ml-2"
        @click="showNewMachine = true"
      />
      <q-btn
        label="Proje Yükle"
        no-caps
        icon="system_update_alt"
        color="primary"
        class="mr-4"
        @click="loadProject"
      />
      <q-btn
        label="Özellikler"
        no-caps
        icon="tune"
        color="primary"
        class="mr-4"
        @click="showEditMachine = true"
      />
      <q-btn
        label="Sil"
        no-caps
        icon="delete"
        color="primary"
        class="mr-4"
        @click="handleMachineDelete()"
      />
      <q-btn
        label="Versiyon Bilgisi Al"
        no-caps
        color="primary"
        class="mr-4"
      />
      <q-btn
        label="Makine Sabitleri"
        no-caps
        color="primary"
        class="mr-4"
        @click="showMachineParameters = true"
      />
      <q-btn
        label="Mimic"
        no-caps
        color="primary"
        class="mr-4"
        @click="showMimic = true"
      />
      <q-btn
        label="Formüller"
        no-caps
        color="primary"
        class="mr-4"
        @click="showFormulas = true"
      />
      <q-btn
        label="Tanımları Al"
        no-caps
        color="primary"
        class="mr-4"
        @click="loadDefinitions"
      />
    </q-card-section>

    <q-card-section class="flex flex-row items-end mr-8">
      <q-chip class="mr-4 mb-2">
        DB v{{ version }}
      </q-chip>
    </q-card-section>
  </q-card>
  <NewMachineDialog
    v-if="showNewMachine"
    :show="showNewMachine"
    @close="showNewMachine = false"
    @add-machine="$emit('addMachine')"
  />
  <EditMachineDialog
    v-if="showEditMachine"
    :show="showEditMachine"
    :selected="selected"
    @close="showEditMachine = false"
    @add-machine="$emit('addMachine')"
  />
  <MachineParametersDialog
    v-if="showMachineParameters"
    :show="showMachineParameters"
    :selected="selected"
    @close="showMachineParameters = false"
  />
  <MimicDialog
    v-if="showMimic"
    :show="showMimic"
    :selected="selected"
    @close="showMimic = false"
  />
  <FormulasDialog
    v-if="showFormulas"
    :show="showFormulas"
    :selected="selected"
    @close="showFormulas = false"
  />
</template>

<style scoped>
</style>
