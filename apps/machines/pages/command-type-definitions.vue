<script setup lang="ts">
import { Sortable } from 'sortablejs-vue3'
import { klona } from 'klona'
import type { SortableEvent } from 'sortablejs'
import type { CommandType } from '~/types'

interface CommandTypeMap {
  ref: Ref<CommandType[]>
  value: number
  title: string
  icon: string
  color: string
}

const kc = useKeycloak()
const { t } = useI18n()
const { notifySuccess, notifyError } = useNotify()
const selectedMachineId = ref<number | null>(null)
const originalCommandTypes = ref<CommandType[]>([])

const genericMaterialIcon = 'i-streamline:interface-arrows-data-transfer-vertical-arrow-square-data-internet-transfer-network-vertical'

const definitionGrid: CommandTypeMap[][] = [
  [
    { ref: ref([]), value: 300, title: t('chemicalTankTransferCommands'), icon: 'i-ri-exchange-2-line', color: '#228B22' },
    { ref: ref([]), value: 100, title: t('chemicalRequestCommands'), icon: 'i-carbon-chemistry', color: '#00CC00' },
    { ref: ref([]), value: 700, title: t('takeSample'), icon: 'i-ph:eyedropper', color: '#0000FF' },
  ],
  [
    { ref: ref([]), value: 400, title: t('dyeTankTransferCommands'), icon: 'i-ri-exchange-2-line', color: '#FF00FF' },
    { ref: ref([]), value: 200, title: t('dyeRequestCommands'), icon: 'i-mingcute:paint-line', color: '#FF00FF' },
    { ref: ref([]), value: 600, title: t('pHControl'), icon: 'i-material-symbols:water-ph-outline', color: '#0000FF' },
  ],
  [
    { ref: ref([]), value: 500, title: t('reserveTankTransferCommands'), icon: 'i-ri-exchange-2-line', color: '#0000FF' },
    { ref: ref([]), value: 800, title: t('saltRequestCommands'), icon: 'i-tabler:salt', color: '#00CC00' },
    { ref: ref([]), value: 1000, title: t('manualMeasurementCommands'), icon: 'i-mdi:hydraulic-oil-level', color: '#1E90FF' },
  ],
  [
    { ref: ref([]), value: 101, title: t('manualChemicalRequestCommands'), icon: 'i-carbon-chemistry', color: '#E67E22' },
    { ref: ref([]), value: 201, title: t('manualDyeRequestCommands'), icon: 'i-mingcute:paint-line', color: '#E67E22' },
  ],
  [
    { ref: ref([]), value: 810, title: t('genericMaterial1Request'), icon: genericMaterialIcon, color: '#00CC00' },
    { ref: ref([]), value: 820, title: t('genericMaterial2Request'), icon: genericMaterialIcon, color: '#E67E22' },
  ],
]

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

    const commandTypeMaps = definitionGrid.flat()

    for (const cmd of commandTypeMaps) {
      cmd.ref.value = []
    }

    data.forEach((commandType: CommandType) => {
      const mapping = commandTypeMaps.find(m => m.value === commandType.commandType)
      if (mapping)
        mapping?.ref.value.push(commandType)
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

function handleDragDrop(e: SortableEvent, commandMap: CommandTypeMap) {
  if (!selectedMachineId.value)
    return
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

const counting = ref(false)

async function handleSubmit() {
  await kc.fetch('/api/commands/command-types', {
    method: 'PUT',
    body: { machineId: selectedMachineId.value, commandTypes: commandTypes.value },
  })
  originalCommandTypes.value = klona(commandTypes.value)
}
async function requestCount() {
  counting.value = true
  try {
    await kc.fetch('/api/commands/calculate-request-count', {
      method: 'POST',
      body: { machineId: selectedMachineId.value },
    })
    await refresh()
    notifySuccess(t('calculateRequestCountSuccess'))
  } catch (error) {
    console.error('Error calculating request count:', error)
    notifyError(t('calculateRequestCountError'))
  } finally {
    counting.value = false
  }
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
  <div class="page">
    <ContextMenu
      :options="contextMenuOptions"
      target=".q-list"
      @click="option => option.onClick(selectedMachineId)"
    />
    <div class="page-container inline-grid gap-8">
      <div class="page-item">
        <span class="item-title">{{ t('machines') }}</span>
        <q-list
          bordered
          separator
          class="overflow-y-auto list-container"
        >
          <q-item
            v-for="machine in machines"
            :key="machine.machineId"
            v-ripple
            dense
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
      <div class="page-item">
        <span class="item-title">{{ t('selectedMachineCommands') }}</span>
        <Sortable
          :list="commands"
          :item-key="(element) => `${element.machineId}-${element.commandNo}`"
          class="q-list q-list--bordered q-list--separator overflow-y-auto list-container"
          :options="{ group: 'group' }"
          @add="(e) => handleDragDropCommands(e)"
        >
          <template #item="{ element }">
            <q-item
              :key="element.commandNo"
              :data-command-no="element.commandNo"
              :data-command-name="element.commandName"
              class="draggable truncate text-ellipsis"
              dense
            >
              <q-item-section>
                {{ `${element.commandNo} ${element.commandName}` }}
              </q-item-section>
            </q-item>
          </template>
        </Sortable>
      </div>
      <div class="page-item">
        <div
          v-for="(row, index) in definitionGrid"
          :key="index"
          class="grid grid-cols-3 gap-4"
        >
          <div v-for="(item, itemIndex) in row" :key="itemIndex">
            <div class="item-title flex items-center gap-2 flex-nowrap whitespace-nowrap">
              <UnoIcon
                :class="item.icon"
                :style="{ color: item.color }"
              />
              <span class="truncate text-ellipsis">{{ item.title }}</span>
            </div>
            <Sortable
              :list="item.ref.value"
              :item-key="(element) => `${element.machineId}-${element.commandNo}`"
              class="q-list q-list--bordered q-list--separator overflow-y-auto dropbox"
              :options="{ group: 'group' }"
              @add="(e) => handleDragDrop(e, item)"
            >
              <template #item="{ element }">
                <q-item
                  :key="element.commandNo"
                  :data-command-no="element.commandNo"
                  :data-command-name="element.commandName"
                  :data-machine-id="element.machineId"
                  class="draggable-selected last:border-b"
                  dense
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
    <div class="flex justify-end gap-4 mt-4">
      <q-btn
        :label="t('submit')"
        no-caps
        color="primary"
        :disabled="!hasChanges"
        @click="handleSubmit"
      />
      <q-btn
        :label="t('calculateReqCount')"
        :loading="counting"
        no-caps
        color="primary"
        :disabled="!selectedMachineId"
        @click="requestCount"
      />
    </div>
  </div>
</template>

<style scoped>
.inline-grid {
  height: fit-content;
}
.page {
  padding: 1rem 2rem;
  overflow: hidden;
}
.page-container {
  display: grid;
  grid-template-columns: 15% 15% 1fr;
}
.page-item {
  min-width: 150px;
  position: relative;
}
.list-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 41px - 8rem);
}

.item-title {
  min-height: 2rem;
  max-height: 2rem;
  line-height: 2rem;
  font-weight: 500;
}
.dropbox-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}
/* 5x3 grid item */
.dropbox {
  /* one item in 5x3 grid, remove 5 gaps */
  height: calc((100vh - 41px - 16rem) / 5);
}
</style>
