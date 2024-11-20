<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { klona } from 'klona'
import type { SortableEvent } from 'sortablejs'
import type { Machine, MasterCommand } from '~/types'
import type { IContextMenuOption } from '~/components/ContextMenu.vue'

const { t } = useI18n()

const selectedMachineId = ref()
const selectedDefinition = ref()

interface TankDefinition {
  machineId: number
  machineName: string
  tankNo: number
  name: string
  highLimit: number
  machineConstantHighLimit: number
  listOfTransferCommands: number[]
  listOfCirculationDosageCommands: number[]
  listOfCirculationRequestCommands: number[]
  listOfRequestCommands: number[]
}

type NumberArrayKeys<T> = {
  [K in keyof T]: T[K] extends number[] ? K : never
}[keyof T]

interface TankCommand {
  commandNo: number
  commandName: string
  tankNo: number
}

interface CommandList {
  name: NumberArrayKeys<TankDefinition>
  ref: TankCommand[]
}

const tank = ref<Partial<TankDefinition>>({
  tankNo: -1,
  name: '',
  highLimit: 0,
  machineConstantHighLimit: 0,
})

const commandLists = reactive<CommandList[]>([
  { name: 'listOfTransferCommands', ref: [] },
  { name: 'listOfCirculationDosageCommands', ref: [] },
  { name: 'listOfCirculationRequestCommands', ref: [] },
  { name: 'listOfRequestCommands', ref: [] },
])

const { data: machines } = useAuthFetch<Machine[]>('/api/machines/active-machines')

const { data: tankDefinitions, refresh: refreshDefinitions } = useAuthFetch<TankDefinition[]>('/api/tank-definitions/tank-definitions', {
  immediate: false,
  default: () => [],
  query: { machineId: selectedMachineId },
})

const { data: highLimitOptions } = useAuthFetch('/api/machine-parameters/machine-parameters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (parameters) => {
    return parameters.map((p) => {
      return {
        label: `${p.paramString} (${p.paramHighLimit})`,
        value: p.paramHighLimit,
      }
    }) as readonly { label: string, value: number }[]
  },
})

const { data: commands, refresh: refreshCommands } = useAuthFetch<MasterCommand[]>('/api/master-commands/master-commands', {
  immediate: false,
  query: { machineId: selectedMachineId },
  default: () => [],
  onResponse({ response }) {
    const data: MasterCommand[] = response._data

    commandLists.forEach(list => list.ref = [])

    tankDefinitions.value.forEach((tankDef) => {
      commandLists.forEach((list: CommandList) => {
        tankDef[list.name].forEach(() => {
          const commandIndex = data.findIndex(d => tankDef[list.name].includes(d.commandNo!))
          if (commandIndex !== -1) {
            const command = data.splice(commandIndex, 1)[0]
            list.ref.push({
              commandNo: command.commandNo!,
              commandName: command.commandName || '',
              tankNo: tankDef.tankNo,
            })
          }
        })
      })
    })

    filterCommandLists()
  },
})

watch([selectedMachineId, selectedDefinition], ([newMachineId, _oldMachineId], [_newDef, _oldDef]) => {
  document.querySelectorAll('.draggable-selected').forEach((el) => {
    if (el.getAttribute('data-machine-id') !== String(newMachineId)) {
      el.remove()
    }
  })
})

function filterCommandLists() {
  if (tank.value.tankNo === undefined || tank.value.tankNo === -1)
    tank.value.tankNo = tankDefinitions.value[0].tankNo
  for (const list of commandLists) {
    list.ref = list.ref.filter(d => d.tankNo === tank.value.tankNo)
  }
}

async function handleTankDefinitionClick(tankDef: TankDefinition) {
  selectedDefinition.value = tankDef.tankNo
  tank.value = tankDef
  await refreshCommands()
}

async function handleTankDefinitionAdd() {
  const tankDef = {
    machineId: selectedMachineId.value,
    ...tank.value,
  }
  await $fetch('/api/tank-definitions/tank-definition', {
    method: 'POST',
    body: tankDef,
  })
  await refreshDefinitions()
}

async function handleDelete() {
  await $fetch('/api/tank-definitions/tank-definition', {
    method: 'DELETE',
    body: {
      machineId: selectedMachineId.value,
      tankNo: tank.value.tankNo,
    },
  })
  await refreshDefinitions()
}

async function handleDragDropCommands(e: SortableEvent) {
  const commandNo = e.item.getAttribute('data-command-no')
  const listName = e.item.getAttribute('data-list-name') as NumberArrayKeys<TankDefinition>

  const tank = tankDefinitions.value.find(d => d.tankNo === selectedDefinition.value)
  if (tank)
    tank[listName] = tank[listName].filter(d => d !== Number(commandNo))
}

async function handleDragDrop(e: SortableEvent, listName: NumberArrayKeys<TankDefinition>) {
  const commandNo = e.item.getAttribute('data-command-no')
  tankDefinitions.value.find(d => d.tankNo === selectedDefinition.value)![listName].push(Number(commandNo))
}

async function handleSubmit() {
  const tankDef = tankDefinitions.value.find(d => d.tankNo === selectedDefinition.value)!

  await $fetch('/api/tank-definitions/tank-definition-list', {
    method: 'PUT',
    body: tankDef,
  })

  await refreshDefinitions()
}

const copy = ref()

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: !selectedMachineId.value,
    onClick: () => {
      copy.value = klona(tankDefinitions.value)
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      for (const tankDef of copy.value) {
        await $fetch('/api/tank-definitions/tank-definition-list', {
          method: 'PUT',
          body: {
            ...tankDef,
            machineId: selectedMachineId.value,
          },
        })
      }
      await refreshDefinitions()
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :context-menu-options="contextMenuOptions"
      target=".q-list"
      @click="(option: IContextMenuOption) => option.onClick(selectedMachineId)"
    />
    <q-card>
      <q-card-section class="flex flex-row justify-around">
        <div class="flex">
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
                @click="selectedMachineId = machine.machineId"
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
            <div class="grid gap-4 mb-4">
              <q-input
                v-model="tank.tankNo"
                :label="t('tankNo')"
                filled
              />
              <q-input
                v-model="tank.name"
                :label="t('tankName')"
                filled
              />
              <q-select
                v-model="tank.highLimit"
                :options="highLimitOptions || []"
                :label="t('highLimit')"
                option-label="label"
                option-value="value"
                filled
              />
              <q-input
                v-model="tank.machineConstantHighLimit"
                filled
                :label="t('machineConstantHighLimit')"
              />
              <q-btn
                :label="t('add')"
                no-caps
                @click="handleTankDefinitionAdd"
              />
              <q-btn
                :label="t('delete')"
                no-caps
                :disable="!tank.tankNo || tank.tankNo === -1"
                @click="handleDelete"
              />
            </div>
            <div class="grid gap-4">
              <div>
                <h3>{{ t('commands') }}</h3>
                <Sortable
                  :list="commands"
                  :item-key="(element) => `${element.machineId}-${element.commandNo}`"
                  class="q-list q-list--bordered q-list--separator overflow-y-auto h-sm"
                  :options="{ group: 'group' }"
                  @add="(e) => handleDragDropCommands(e)"
                >
                  <template #item="{ element }">
                    <q-item
                      :key="element.commandNo"
                      :data-command-no="element.commandNo"
                      class="draggable"
                    >
                      <q-item-section>
                        {{ `${element.commandNo} ${element.commandName}` }}
                      </q-item-section>
                    </q-item>
                  </template>
                </Sortable>
              </div>

              <div class="grid gap-4">
                <div
                  v-for="list in commandLists"
                  :key="list.name"
                >
                  <h3>{{ t(list.name) }}</h3>
                  <Sortable
                    :list="list.ref"
                    :item-key="(element) => `${element.machineId}-${element.commandNo}`"
                    class="q-list q-list--bordered q-list--separator h-40 overflow-y-auto"
                    :options="{ group: 'group' }"
                    @add="(e) => handleDragDrop(e, list.name)"
                  >
                    <template #item="{ element }">
                      <q-item
                        :key="element.commandNo"
                        :data-command-no="element.commandNo"
                        :data-list-name="list.name"
                        :data-machine-id="element.machineId"
                        class="draggable-selected"
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
        </div>
      </q-card-section>
      <q-card-actions align="right" class="mt-4 mr-4">
        <q-btn
          no-caps
          :label="t('cancel')"
          @click="$router.go(0)"
        />
        <q-btn
          color="primary"
          no-caps
          :label="t('submit')"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<style scoped>
.grid {
  grid-template-areas:
    '1 1'
    '1 1';
}
</style>
