<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'

const selectedMachineId = ref()
const selectedDefinition = ref()
const tankNo = ref()
const tankName = ref()
const highLimit = ref()
const machineConstantHighLimit = ref()

const listOfTransferCommands = ref([])
const listOfCirculationDoSageCommand = ref([])
const listOfCirculationRequestCommands = ref([])
const listOfRequestCommands = ref([])

const { data: machines } = useLazyFetch('/api/command-timeout-reasons/command-map-machines')

const { data: tankDefinitions, refresh: refreshDefinitions } = useLazyFetch('/api/tank-definitions/tank-definitions', {
  immediate: false,
  default: () => [],
  query: { machineId: selectedMachineId },
})

const { data: commands, refresh: refreshCommands } = useLazyFetch('/api/master-commands/master-commands', {
  immediate: false,
  query: { machineId: selectedMachineId },
  default: () => [],
  onResponse({ request, response, options }) {
    const data = response._data

    const lists = [
      { name: 'listOfTransferCommands', ref: listOfTransferCommands },
      { name: 'listOfCirculationDoSageCommand', ref: listOfCirculationDoSageCommand },
      { name: 'listOfCirculationRequestCommands', ref: listOfCirculationRequestCommands },
      { name: 'listOfRequestCommands', ref: listOfRequestCommands },
    ]

    lists.forEach(list => list.ref.value = [])

    tankDefinitions.value.forEach((tankDef) => {
      lists.forEach((list) => {
        tankDef[list.name].forEach((commandNo) => {
          const commandIndex = data.findIndex(d => tankDef[list.name].includes(d.commandNo))
          if (commandIndex !== -1) {
            const command = data.splice(commandIndex, 1)[0]
            list.ref.value.push({
              commandNo: command.commandNo,
              commandName: command.commandName,
              tankNo: tankDef.tankNo,
            })
          }
        })
      })
    })

    commands.value = data
    filterCommandLists()
  },
})

const { data: highLimitOptions } = useLazyFetch('/api/machine-parameters/machine-parameters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (parameters) => {
    return parameters.map((p) => {
      return {
        label: `${p.paramString} (${p.paramHighLimit})`,
        value: p.paramHighLimit,
      }
    })
  },
})
async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
}

async function handleTankDefinitionClick(tankDef) {
  selectedDefinition.value = tankDef.tankNo
  tankNo.value = tankDef.tankNo
  tankName.value = tankDef.name
  highLimit.value = tankDef.highLimit
  machineConstantHighLimit.value = tankDef.machineConstantHighLimit
  await refreshCommands()
}

async function handleTankDefinitionAdd() {
  const tankDef = {
    machineId: selectedMachineId.value,
    tankNo: tankNo.value,
    name: tankName.value,
    highLimit: highLimit.value.value,
    machineConstantHighLimit: machineConstantHighLimit.value,
  }
  await addTankDefinition(tankDef)
  await refreshDefinitions()
}

function filterCommandLists() {
  const lists = [
    { name: 'listOfTransferCommands', ref: listOfTransferCommands },
    { name: 'listOfCirculationDoSageCommand', ref: listOfCirculationDoSageCommand },
    { name: 'listOfCirculationRequestCommands', ref: listOfCirculationRequestCommands },
    { name: 'listOfRequestCommands', ref: listOfRequestCommands },
  ]

  if (tankNo.value === undefined)
    tankNo.value = tankDefinitions.value[0].tankNo
  for (const list of lists) {
    list.ref.value = list.ref.value.filter(d => d.tankNo === tankNo.value)
  }
}

function handleDragDrop(e) {
  console.log('e = ', e)
}
</script>

<template>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="flex flex-row">
      <div class="mr-8 w-xs">
        <h3>Makineler</h3>
        <q-list bordered separator>
          <q-item
            v-for="machine in machines"
            :key="machine.machineId"
            v-ripple
            clickable
            :focused="selectedMachineId === machine.machineId"
            :active="selectedMachineId === machine.machineId"
            @click="handleMachineClick(machine.machineId)"
          >
            <q-item-section>
              {{ machine.machineName }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-xs mr-8">
        <h3>Kazan Tanımları</h3>
        <q-list bordered separator>
          <q-item
            v-for="def in tankDefinitions"
            :key="def.tankNo"
            v-ripple
            clickable
            :focused="selectedDefinition === def.tankNo"
            :active="selectedDefinition === def.tankNo"
            @click="handleTankDefinitionClick(def)"
          >
            <q-item-section>
              {{ def.name }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-3xl flex flex-col">
        <div class="grid">
          <q-input
            v-model="tankNo"
            label="Kazan no"
            filled
          />
          <q-input
            v-model="tankName"
            label="Kazan Adı"
            filled
          />
          <q-select
            v-model="highLimit"
            :options="highLimitOptions"
            label="Üst Limit Makine Sabiti"
            option-label="label"
            option-value="value"
            filled
          />
          <q-input
            v-model="machineConstantHighLimit"
            filled
            label="Üst Limit"
          />
          <q-btn
            label="Ekle"
            no-caps
            @click="handleTankDefinitionAdd"
          />
        </div>
        <div class="grid">
          <div class="h-sm overflow-y-scroll">
            <h3>Komutlar</h3>
            <Sortable
              :list="commands"
              item-key="id"
              class=""
              :options="{ group: 'group' }"
              @update="handleDragDrop"
            >
              <template #item="{ element, index }">
                <div
                  :key="element.commandNo"
                  class="draggable"
                >
                  {{ `${element.commandNo} ${element.commandName}` }}
                </div>
              </template>
            </Sortable>
          </div>

          <div class="grid">
            <div>
              <h3>Transfer/Dozaj Komutları</h3>
              <Sortable
                :list="listOfTransferCommands"
                item-key="id"
                :options="{ group: 'group' }"
              >
                <template #item="{ element, index }">
                  <div
                    :key="element.commandNo"
                    class="draggable"
                  >
                    {{ `${element.commandNo} ${element.commandName}` }}
                  </div>
                </template>
              </Sortable>
            </div>
            <div>
              <h3>İstek Komutları</h3>
              <Sortable
                :list="listOfRequestCommands"
                item-key="id"
                :options="{ group: 'group' }"
              >
                <template #item="{ element, index }">
                  <div
                    :key="element.commandNo"
                    class="draggable"
                  >
                    {{ `${element.commandNo} ${element.commandName}` }}
                  </div>
                </template>
              </Sortable>
            </div>

            <div>
              <h3>Sirkülasyonlu Dozaj Komutları</h3>
              <Sortable
                :list="listOfCirculationDoSageCommand"
                item-key="id"
                :options="{ group: 'group' }"
              >
                <template #item="{ element, index }">
                  <div
                    :key="element.commandNo"
                    class="draggable"
                  >
                    {{ `${element.commandNo} ${element.commandName}` }}
                  </div>
                </template>
              </Sortable>
            </div>

            <div>
              <h3>Sirkülasyonlu İstek Komutları</h3>
              <Sortable
                :list="listOfCirculationRequestCommands"
                item-key="id"
                :options="{ group: 'group' }"
              >
                <template #item="{ element, index }">
                  <div
                    :key="element.commandNo"
                    class="draggable"
                  >
                    {{ `${element.commandNo} ${element.commandName}` }}
                  </div>
                </template>
              </Sortable>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.grid {
  grid-template-areas: "1 1"
                       "1 1";
  gap: 2em;
  margin-top: 4em;
}

.input-field {
  grid-template-areas: "1 1"
                       "1 1";
  gap: 1em;
}
</style>
