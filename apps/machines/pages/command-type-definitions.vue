<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import type { CommandType } from '~/types'

interface commandTypeMap {
  ref: CommandType[]
  value: number
  title: string
}

const selectedMachineId = ref()

const commandTypeMaps = reactive<commandTypeMap[]>([
  { ref: [], value: 100, title: 'Kimyasal İstek Komutları' },
  { ref: [], value: 101, title: 'Manuel Kimyasal İstek Komutları' },
  { ref: [], value: 200, title: 'Boya İstek Komutları' },
  { ref: [], value: 201, title: 'Manuel Boya İstek Komutları' },
  { ref: [], value: 300, title: 'Kimyasal Kazanı Transfer Komutları' },
  { ref: [], value: 400, title: 'Boya Kazanı Transfer Komutları' },
  { ref: [], value: 500, title: 'Rezerve Kazanı Transfer Komutları' },
  { ref: [], value: 600, title: 'pH Kontrol' },
  { ref: [], value: 700, title: 'Numune Al' },
  { ref: [], value: 800, title: 'Tuz İstek Komutları' },
  { ref: [], value: 810, title: 'Jenerik Materyal 1 İstek' },
  { ref: [], value: 820, title: 'Jenerik Materyal 2 İstek' },
  { ref: [], value: 1000, title: 'Manuel Ölçüm Komutları' },
])

const { data: machines } = useLazyFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const { data: commands } = useLazyFetch('/api/commands/unused-commands', {
  default: () => [],
  immediate: false,
  query: {
    machineId: selectedMachineId,
  },
})

const { data: commandTypes } = useLazyFetch<CommandType[]>('/api/commands/command-types', {
  default: () => [],
  immediate: false,
  query: {
    machineId: selectedMachineId,
  },
  onResponse: ({ response }) => {
    const data = response._data

    for (const cmd of commandTypeMaps) {
      cmd.ref = []
    }

    data.forEach((commandType: CommandType) => {
      const mapping = commandTypeMaps.find(m => m.value === commandType.commandType)
      if (mapping)
        mapping?.ref.push(commandType)
    })

    commandTypes.value = data
  },
})

function handleDragDropCommands(e) {
  const commandNo = e.item.getAttribute('data-command-no')
  commandTypes.value = commandTypes.value.filter(cmd => cmd.commandNo !== Number(commandNo))
}

function handleDragDrop(e, commandMap: commandTypeMap) {
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
      commandName,
    })
  }
}

async function handleSubmit() {
  await $fetch('/api/commands/command-types', {
    method: 'PUT',
    body: { commandTypes: commandTypes.value },
  })
}
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section class="w-2xs">
      <h3>Makineler</h3>
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
          @click="selectedMachineId = machine.machineId"
        >
          <q-item-section>
            {{ machine.machineCode }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
    <q-card-section class="w-2xs">
      <h3>Seçili Makine Komutları</h3>
      <Sortable
        :list="commands"
        item-key="id"
        class="q-list q-list--bordered q-list--separator h-160 overflow-y-auto"
        :options="{ group: 'group' }"
        @add="(e) => handleDragDropCommands(e)"
      >
        <template #item="{ element, index }">
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
    </q-card-section>

    <q-card-section class="inline-grid grid-cols-5 gap-5 ml-8">
      <div
        v-for="item in commandTypeMaps"
        :key="item.value"
        class="w-2xs box"
      >
        <h3>{{ item.title }}</h3>
        <Sortable
          :list="item.ref"
          item-key="id"
          class="q-list q-list--bordered q-list--separator overflow-y-auto h-50"
          :options="{ group: 'group' }"
          @add="(e) => handleDragDrop(e, item)"
        >
          <template #item="{ element, index }">
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
    </q-card-section>
  </q-card>
  <q-btn-group>
    <q-btn @click="handleSubmit">
      Kaydet
    </q-btn>
    <q-btn>İptal</q-btn>
  </q-btn-group>
</template>

<style scoped>
.inline-grid {
  height: fit-content;
}
</style>
