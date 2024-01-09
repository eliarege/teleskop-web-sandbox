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
const cmdOperatorWarningCommands = ref<CommandType[]>([])
const cmdManuelMeasuredCommands = ref<CommandType[]>([])

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

const commandTypeMap = [
  { label: 'cmdTypeChemicalReq', value: 100 },
  { label: 'cmdTypeManualChemicalReq', value: 101 },
  { label: 'cmdTypeDyeReq', value: 200 },
  { label: 'cmdTypeManualDyeReq', value: 201 },
  { label: 'cmdTypeCTTransfer', value: 300 },
  { label: 'cmdTypeDTTransfer', value: 400 },
  { label: 'cmdTypeRTTransfer', value: 500 },
  { label: 'cmdTypePhControl', value: 600 },
  { label: 'cmdTypeSample', value: 700 },
  { label: 'cmdTypeSaltReq', value: 800 },
  { label: 'cmdTypeGenericMaterialOneReq', value: 810 },
  { label: 'cmdTypeGenericMaterialTwoReq', value: 820 },
  { label: 'cmdOperatorWarningCommands', value: 90 },
  { label: 'cmdManuelMeasuredCommands', value: 1000 },
]

const { data: commandTypes } = useLazyFetch('/api/commands/command-types', {
  default: () => [],
  immediate: false,
  query: {
    machineId: selectedMachineId,
  },
})

function mapCommandToTypeArray(command: CommandType) {
  const mapping = commandTypeMap.find(m => m.value === command.commandType)
  if (!mapping)
    return

  switch (mapping.label) {
    case 'cmdTypeChemicalReq':
      cmdTypeChemicalReq.value.push(command)
      break
    case 'cmdTypeManualChemicalReq':
      cmdTypeManualChemicalReq.value.push(command)
      break
    case 'cmdTypeDyeReq':
      cmdTypeDyeReq.value.push(command)
      break
    case 'cmdTypeManualDyeReq':
      cmdTypeManualDyeReq.value.push(command)
      break
    case 'cmdTypeCTTransfer':
      cmdTypeCTTransfer.value.push(command)
      break
    case 'cmdTypeDTTransfer':
      cmdTypeDTTransfer.value.push(command)
      break
    case 'cmdTypeRTTransfer':
      cmdTypeRTTransfer.value.push(command)
      break
    case 'cmdTypePhControl':
      cmdTypePhControl.value.push(command)
      break
    case 'cmdTypeSample':
      cmdTypeSample.value.push(command)
      break
    case 'cmdTypeSaltReq':
      cmdTypeSaltReq.value.push(command)
      break
    case 'cmdTypeGenericMaterialOneReq':
      cmdTypeGenericMaterialOneReq.value.push(command)
      break
    case 'cmdTypeGenericMaterialTwoReq':
      cmdTypeGenericMaterialTwoReq.value.push(command)
      break
    case 'cmdOperatorWarningCommands':
      cmdOperatorWarningCommands.value.push(command)
      break
    case 'cmdManuelMeasuredCommands':
      cmdManuelMeasuredCommands.value.push(command)
      break
    default:
      console.warn('Unrecognized command type:', command.commandType)
  }
}

watch(commandTypes, (_newCommandTypes) => {
  cmdTypeChemicalReq.value = []
  cmdTypeManualChemicalReq.value = []
  cmdTypeDyeReq.value = []
  cmdTypeManualDyeReq.value = []
  cmdTypeCTTransfer.value = []
  cmdTypeDTTransfer.value = []
  cmdTypeRTTransfer.value = []
  cmdTypePhControl.value = []
  cmdTypeSample.value = []
  cmdTypeSaltReq.value = []
  cmdTypeGenericMaterialOneReq.value = []
  cmdTypeGenericMaterialTwoReq.value = []
  cmdOperatorWarningCommands.value = []
  cmdManuelMeasuredCommands.value = []

  commandTypes.value.forEach((command) => {
    mapCommandToTypeArray(command)
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
      <div class="w-sm box">
        <h3>Kimyasal Kazanı Transfer Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeCTTransfer"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Kimyasal İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeChemicalReq"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Boya Kazanı Transfer Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeDTTransfer"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Boya İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeDyeReq"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>pH Kontrol</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypePhControl"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Rezerve Kazanı Transfer Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeRTTransfer"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Tuz İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeSaltReq"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Manuel Ölçüm Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdManuelMeasuredCommands"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Manuel Kimyasal İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeManualChemicalReq"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Manuel Boya İstek Komutları</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeManualDyeReq"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Jenerik Materyal 1 İstek</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeGenericMaterialOneReq"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-sm box">
        <h3>Jenerik Materyal 2 İstek</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeGenericMaterialTwoReq"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="w-sm box">
        <h3>Numune Al</h3>
        <q-list bordered separator>
          <q-item
            v-for="commandType in cmdTypeSample"
            :key="commandType.commandNo"
            v-ripple
            clickable
          >
            <q-item-section>
              {{ commandType.commandName }}
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
