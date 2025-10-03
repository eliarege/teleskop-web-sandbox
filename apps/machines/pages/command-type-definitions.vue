<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { klona } from 'klona'
import type { SortableEvent } from 'sortablejs'
import type { CommandType } from '~/types'

interface commandTypeMap {
  ref: CommandType[]
  value: number
  title: string
}

const kc = useKeycloak()
const { t } = useI18n()
const selectedMachineId = ref()
const originalCommandTypes = ref<CommandType[]>([])

const commandTypeMaps = reactive<commandTypeMap[]>([
  { ref: [], value: 100, title: t('chemicalRequestCommands') },
  { ref: [], value: 101, title: t('manualChemicalRequestCommands') },
  { ref: [], value: 200, title: t('paintRequestCommands') },
  { ref: [], value: 201, title: t('manualPaintRequestCommands') },
  { ref: [], value: 300, title: t('chemicalTankTransferCommands') },
  { ref: [], value: 400, title: t('paintTankTransferCommands') },
  { ref: [], value: 500, title: t('reserveTankTransferCommands') },
  { ref: [], value: 600, title: t('pHControl') },
  { ref: [], value: 700, title: t('takeSample') },
  { ref: [], value: 800, title: t('saltRequestCommands') },
  { ref: [], value: 810, title: t('genericMaterial1Request') },
  { ref: [], value: 820, title: t('genericMaterial2Request') },
  { ref: [], value: 1000, title: t('manualMeasurementCommands') },
])

const { data: machines } = useAuthFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: commands } = useAuthFetch('/api/commands/unused-commands', {
  default: () => [],
  immediate: false,
  query: {
    machineId: selectedMachineId,
  },
})

const { data: commandTypes, refresh } = useAuthFetch<CommandType[]>('/api/commands/command-types', {
  default: () => [],
  immediate: false,
  query: {
    machineId: selectedMachineId,
  },
  onResponse: ({ response }) => {
    const data = response._data
    originalCommandTypes.value = klona(data)

    for (const cmd of commandTypeMaps) {
      cmd.ref = []
    }

    data.forEach((commandType: CommandType) => {
      const mapping = commandTypeMaps.find(m => m.value === commandType.commandType)
      if (mapping)
        mapping?.ref.push(commandType)
    })
  },
})

const hasChanges = computed(() => {
  if (!originalCommandTypes.value.length && !commandTypes.value.length)
    return false
  return JSON.stringify(originalCommandTypes.value) !== JSON.stringify(commandTypes.value)
})

watch(selectedMachineId, (_newMachineId, _oldMachineId) => {
  const elements = document.querySelectorAll('[data-command-no]')
  elements.forEach((el) => {
    el.remove()
  })
})

function handleDragDropCommands(e: SortableEvent) {
  const commandNo = e.item.getAttribute('data-command-no')
  commandTypes.value = commandTypes.value.filter(cmd => cmd.commandNo !== Number(commandNo))
}

function handleDragDrop(e: SortableEvent, commandMap: commandTypeMap) {
  const commandNo = e.item.getAttribute('data-command-no')
  const commandName = e.item.getAttribute('data-command-name')
  const command = commandTypes.value.find(cmd => cmd.commandNo === Number(commandNo))
  if (command) {
    command.commandType = commandMap.value
  } else {
    commandTypes.value.push({
      machineId: selectedMachineId.value,
      commandNo: Number(commandNo),
      commandType: commandMap.value,
      commandName: commandName ?? '',
    })
  }
}

async function handleSubmit() {
  await kc.fetch('/api/commands/command-types', {
    method: 'PUT',
    body: { machineId: selectedMachineId.value, commandTypes: commandTypes.value },
  })
  originalCommandTypes.value = klona(commandTypes.value)
}
async function requestCount() {
  await kc.fetch('/api/commands/calculate-request-count', {
    method: 'POST',
    body: { machineId: selectedMachineId.value },
  })
  await refresh()
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
      copy.value = klona(commandTypes.value)
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      await kc.fetch('/api/commands/command-types', {
        method: 'PUT',
        body: {
          machineId: selectedMachineId.value,
          commandTypes: copy.value.map((item: CommandType) => ({
            ...item,
            machineId: selectedMachineId.value,
          })),
        },
      })
      await refresh()
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :options="contextMenuOptions"
      target=".q-list"
      @click="option => option.onClick(selectedMachineId)"
    />
    <q-card>
      <q-card-section class="flex">
        <div class="w-2xs">
          <h3>{{ t('machines') }}</h3>
          <q-list
            bordered
            separator
            class="h-160 overflow-y-auto"
          >
            <q-item
              v-for="machine in machines"
              :key="machine.machineId"
              v-ripple
              clickable
              :class="{ 'bg-primary text-white': selectedMachineId === machine.machineId }"
              @click="selectedMachineId = machine.machineId"
            >
              <q-item-section>
                {{ machine.machineCode }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="w-2xs">
          <h3>{{ t('selectedMachineCommands') }}</h3>
          <Sortable
            :list="commands"
            :item-key="(element) => `${element.machineId}-${element.commandNo}`"
            class="q-list q-list--bordered q-list--separator h-160 overflow-y-auto"
            :options="{ group: 'group' }"
            @add="(e) => handleDragDropCommands(e)"
          >
            <template #item="{ element }">
              <q-item
                :key="element.commandNo"
                :data-command-no="element.commandNo"
                :data-command-name="element.commandName"
                class="draggable"
              >
                <q-item-section>
                  {{ `${element.commandNo} ${element.commandName}` }}
                </q-item-section>
              </q-item>
            </template>
          </Sortable>
        </div>

        <q-card-section class="inline-grid grid-cols-5 gap-3 ml-8">
          <div
            v-for="item in commandTypeMaps"
            :key="item.value"
            class="w-2xs box"
          >
            <h3>{{ item.title }}</h3>
            <Sortable
              :list="item.ref"
              :item-key="(element) => `${element.machineId}-${element.commandNo}`"
              class="q-list q-list--bordered q-list--separator overflow-y-auto h-42"
              :options="{ group: 'group' }"
              @add="(e) => handleDragDrop(e, item)"
            >
              <template #item="{ element }">
                <q-item
                  :key="element.commandNo"
                  :data-command-no="element.commandNo"
                  :data-command-name="element.commandName"
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
        </q-card-section>
      </q-card-section>
      <q-card-actions align="right" class="flex gap-2 ">
        <q-btn
          no-caps
          :label="t('cancel')"
          :disabled="!hasChanges"
        />
        <q-btn
          :label="t('submit')"
          no-caps
          color="primary"
          :disabled="!hasChanges"
          @click="handleSubmit"
        />
        <q-btn
          :label="t('calculateReqCount')"
          no-caps
          color="primary"
          :disabled="!selectedMachineId"
          @click="requestCount"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<style scoped>
.inline-grid {
  height: fit-content;
}
</style>
