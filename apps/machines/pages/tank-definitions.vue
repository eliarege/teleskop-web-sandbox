<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { updateTankDefinitionList } from '~/utils'

const { t } = useI18n()

const selectedMachineId = ref()
const selectedDefinition = ref()
const tankNo = ref()
const tankName = ref()
const highLimit = ref()
const machineConstantHighLimit = ref()

const listOfTransferCommands = ref([])
const listOfCirculationDoSageCommands = ref([])
const listOfCirculationRequestCommands = ref([])
const listOfRequestCommands = ref([])

const lists = [
  { name: 'listOfTransferCommands', ref: listOfTransferCommands },
  { name: 'listOfCirculationDoSageCommands', ref: listOfCirculationDoSageCommands },
  { name: 'listOfCirculationRequestCommands', ref: listOfCirculationRequestCommands },
  { name: 'listOfRequestCommands', ref: listOfRequestCommands },
]

const { data: machines } = useLazyFetch('/api/machines/active-machines')

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
  if (tankNo.value === undefined)
    tankNo.value = tankDefinitions.value[0].tankNo
  for (const list of lists) {
    list.ref.value = list.ref.value.filter(d => d.tankNo === tankNo.value)
  }
}

async function handleDragDrop(e, listName) {
  const text: string = e.item.innerHTML
  const matches = text.match(/(\d+) (.+)/)
  if (matches && matches.length) {
    const commandNo = Number.parseInt(matches[0])
    let action
    if (e.type === 'add')
      action = 'add'
    else if (e.type === 'remove')
      action = 'remove'

    await updateTankDefinitionList({
      machineId: selectedMachineId.value,
      tankDefinitionId: selectedDefinition.value,
      listName,
      commandNo,
      action,
    })
    await refreshDefinitions()
  }
}
</script>

<template>
  <q-card class="flex flex-row justify-around">
    <q-card-section class="flex flex-row">
      <div class="mr-8 w-xs">
        <h3>{{ t('machines') }}</h3>
        <q-list
          bordered
          separator
          class="overflow-y-auto h-160 w-xs"
        >
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
              {{ machine.machineCode }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="w-xs mr-8">
        <h3>{{ t('tankDefinitions') }}</h3>
        <q-list
          bordered
          separator
          class="overflow-y-auto h-160 w-xs"
        >
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
        <div class="grid mb-4">
          <q-input
            v-model="tankNo"
            :label="t('tankNo')"
            filled
          />
          <q-input
            v-model="tankName"
            :label="t('tankName')"
            filled
          />
          <q-select
            v-model="highLimit"
            :options="highLimitOptions"
            :label="t('highLimit')"
            option-label="label"
            option-value="value"
            filled
          />
          <q-input
            v-model="machineConstantHighLimit"
            filled
            :label="t('machineConstantHighLimit')"
          />
          <q-btn
            :label="t('add')"
            no-caps
            @click="handleTankDefinitionAdd"
          />
        </div>
        <div class="grid">
          <div>
            <h3>{{ t('commands') }}</h3>
            <Sortable
              :list="commands"
              item-key="id"
              class="q-list q-list--bordered q-list--separator overflow-y-auto h-xs"
              :options="{ group: 'group' }"
            >
              <template #item="{ element, index }">
                <q-item
                  :key="element.commandNo"
                  class="draggable"
                >
                  <q-item-section>
                    {{ `${element.commandNo} ${element.commandName}` }}
                  </q-item-section>
                </q-item>
              </template>
            </Sortable>
          </div>

          <div class="grid">
            <div>
              <h3>{{ t('transferDosageCommands') }}</h3>
              <Sortable
                :list="listOfTransferCommands"
                item-key="id"
                class="q-list q-list--bordered q-list--separator h-40 overflow-y-auto"
                :options="{ group: 'group' }"
                @add="(e) => handleDragDrop(e, 'listOfTransferCommands')"
                @remove="(e) => handleDragDrop(e, 'listOfTransferCommands')"
              >
                <template #item="{ element, index }">
                  <q-item
                    :key="element.commandNo"
                    class="draggable"
                    :data-command-no="element.commandNo"
                  >
                    <q-item-section>
                      {{ `${element.commandNo} ${element.commandName}` }}
                    </q-item-section>
                  </q-item>
                </template>
              </Sortable>
            </div>
            <div>
              <h3>{{ t('requestCommands') }}</h3>
              <Sortable
                :list="listOfRequestCommands"
                item-key="id"
                class="q-list q-list--bordered q-list--separator h-40 overflow-y-auto"
                :options="{ group: 'group' }"
                @add="(e) => handleDragDrop(e, 'listOfRequestCommands')"
                @remove="(e) => handleDragDrop(e, 'listOfRequestCommands')"
              >
                <template #item="{ element, index }">
                  <q-item
                    :key="element.commandNo"
                    class="draggable"
                  >
                    <q-item-section>
                      {{ `${element.commandNo} ${element.commandName}` }}
                    </q-item-section>
                  </q-item>
                </template>
              </Sortable>
            </div>

            <div>
              <h3>{{ t('circulationDosageCommands') }}</h3>
              <Sortable
                :list="listOfCirculationDoSageCommands"
                item-key="id"
                class="q-list q-list--bordered q-list--separator h-40 overflow-y-auto"
                :options="{ group: 'group' }"
                @add="(e) => handleDragDrop(e, 'listOfCirculationDoSageCommands')"
                @remove="(e) => handleDragDrop(e, 'listOfCirculationDoSageCommands')"
              >
                <template #item="{ element, index }">
                  <q-item
                    :key="element.commandNo"
                    class="draggable"
                  >
                    <q-item-section>
                      {{ `${element.commandNo} ${element.commandName}` }}
                    </q-item-section>
                  </q-item>
                </template>
              </Sortable>
            </div>

            <div>
              <h3>{{ t('circulationRequestCommands') }}</h3>
              <Sortable
                :list="listOfCirculationRequestCommands"
                item-key="id"
                class="q-list q-list--bordered q-list--separator h-40 overflow-y-auto"
                :options="{ group: 'group' }"
                @add="(e) => handleDragDrop(e, 'listOfCirculationRequestCommands')"
                @remove="(e) => handleDragDrop(e, 'listOfCirculationRequestCommands')"
              >
                <template #item="{ element, index }">
                  <q-item
                    :key="element.commandNo"
                    class="draggable"
                  >
                    <q-item-section>
                      {{ `${element.commandNo} ${element.commandName}` }}
                    </q-item-section>
                  </q-item>
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
}
</style>
