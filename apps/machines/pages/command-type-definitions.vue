<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { CommandType } from '~/types'

const selectedMachineId = ref()
const selectedCommandNo = ref()

const cmdTypeChemicalReq = ref<CommandType[]>([])
const cmdTypeManualChemicalReq = ref<CommandType[]>([])
const cmdTypeDyeReq = ref<CommandType[]>([])
const cmdTypeManualDyeReq = ref<CommandType[]>([])
const cmdTypeCTTransfer = ref<CommandType[]>([])
const cmdTypeDTTransfer = ref<CommandType[]>([])
const cmdTypeRTTransfer = ref<CommandType[]>([])
const cmdTypePhControl = ref<CommandType[]>([])
const cmdTypeSample = ref<CommandType[]>([])
const cmdTypeSaltReq = ref<CommandType[]>([])
const cmdTypeGenericMaterialOneReq = ref<CommandType[]>([])
const cmdTypeGenericMaterialTwoReq = ref<CommandType[]>([])
const cmdManuelMeasuredCommands = ref<CommandType[]>([])
// const cmdOperatorWarningCommands = ref<CommandType[]>([])

const { data: machines } = useLazyFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: commands } = useLazyFetch('/api/master-commands/master-commands', {
  default: () => [],
  immediate: false,
  query: {
    machineId: selectedMachineId,
  },
})

const commandTypeMap = reactive([
  { ref: cmdTypeChemicalReq, label: 'cmdTypeChemicalReq', value: 100, title: 'Kimyasal İstek Komutları' },
  { ref: cmdTypeManualChemicalReq, label: 'cmdTypeManualChemicalReq', value: 101, title: 'Manuel Kimyasal İstek Komutları' },
  { ref: cmdTypeDyeReq, label: 'cmdTypeDyeReq', value: 200, title: 'Boya İstek Komutları' },
  { ref: cmdTypeManualDyeReq, label: 'cmdTypeManualDyeReq', value: 201, title: 'Manuel Boya İstek Komutları' },
  { ref: cmdTypeCTTransfer, label: 'cmdTypeCTTransfer', value: 300, title: 'Kimyasal Kazanı Transfer Komutları' },
  { ref: cmdTypeDTTransfer, label: 'cmdTypeDTTransfer', value: 400, title: 'Boya Kazanı Transfer Komutları' },
  { ref: cmdTypeRTTransfer, label: 'cmdTypeRTTransfer', value: 500, title: 'Rezerve Kazanı Transfer Komutları' },
  { ref: cmdTypePhControl, label: 'cmdTypePhControl', value: 600, title: 'pH Kontrol' },
  { ref: cmdTypeSample, label: 'cmdTypeSample', value: 700, title: 'Numune Al' },
  { ref: cmdTypeSaltReq, label: 'cmdTypeSaltReq', value: 800, title: 'Tuz İstek Komutları' },
  { ref: cmdTypeGenericMaterialOneReq, label: 'cmdTypeGenericMaterialOneReq', value: 810, title: 'Jenerik Materyal 1 İstek' },
  { ref: cmdTypeGenericMaterialTwoReq, label: 'cmdTypeGenericMaterialTwoReq', value: 820, title: 'Jenerik Materyal 2 İstek' },
  { ref: cmdManuelMeasuredCommands, label: 'cmdManuelMeasuredCommands', value: 1000, title: 'Manuel Ölçüm Komutları' },
  // { ref: cmdOperatorWarningCommands, label: 'cmdOperatorWarningCommands', value: 90, title: null },
])

const { data: commandTypes } = useLazyFetch('/api/commands/command-types', {
  default: () => [],
  immediate: false,
  query: {
    machineId: selectedMachineId,
  },
})

watch(commandTypes, (_newCommandTypes) => {
  for (const cmd of commandTypeMap) {
    cmd.ref = []
  }

  commandTypes.value.forEach((command) => {
    const mapping = commandTypeMap.find(m => m.value === command.commandType)
    if (mapping)
      mapping?.ref.push(command)
  })
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section class="w-sm">
      <h3>Makineler</h3>
      <q-list bordered separator>
        <q-item
          v-for="machine in machines"
          :key="machine.machineId"
          v-ripple
          clickable
          @click="handleMachineClick(machine.machineId)"
        >
          <q-item-section>
            {{ machine.machineCode }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
    <q-card-section class="w-sm">
      <h3>Seçili Makine Komutları</h3>
      <q-list bordered separator>
        <q-item
          v-for="command in commands"
          :key="command.commandNo"
          v-ripple
          clickable
          @click="selectedCommandNo = command.commandNo"
        >
          <q-item-section>
            {{ command.commandName }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section class="grid flex-grow">
      <div
        v-for="item in commandTypeMap"
        :key="item.value"
        class="w-sm box"
      >
        <h3>{{ item.title }}</h3>
        <q-list bordered separator>
          <q-item
            v-for="cmd in item.ref"
            :key="cmd.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ cmd.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.box {
  max-width: 20em;
  max-height: 20em;
  overflow-y: scroll;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3em;
}
</style>
