<script setup lang="ts">
import type { Machine } from '~/types'
import { deleteMachines } from '~/utils'

const props = defineProps<{
  machines: Machine[]
  selectedMachines: Machine[]
}>()

const emit = defineEmits(['deleteMachine', 'addMachine'])

const showNewMachine = ref(false)
const showEditMachine = ref(false)
const showMachineParameters = ref(false)
const showMimic = ref(false)

async function handleMachineDelete() {
  const machineIds = props.selectedMachines.map(m => m.id)
  await deleteMachines(machineIds)
  emit('deleteMachine', machineIds)
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
    </q-card-section>

    <q-card-section class="flex flex-row items-end mr-8">
      <q-chip class="mr-4 mb-2">
        DB v3.3.95.0
      </q-chip>
      <q-card class="flex flex row mb-2 items-center">
        <q-card-section>
          Hoşgeldiniz Barış
        </q-card-section>
        <q-card-section>
          <q-btn no-caps>
            Çıkış Yap
          </q-btn>
        </q-card-section>
      </q-card>
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
    :selected-machines="selectedMachines"
    @close="showEditMachine = false"
    @add-machine="$emit('addMachine')"
  />
  <MachineParametersDialog
    v-if="showMachineParameters"
    :show="showMachineParameters"
    :selected-machines="selectedMachines"
    @close="showMachineParameters = false"
  />
  <MimicDialog
    v-if="showMimic"
    :show="showMimic"
    :selected-machines="selectedMachines"
    @close="showMimic = false"
  />
</template>

<style scoped>
</style>
