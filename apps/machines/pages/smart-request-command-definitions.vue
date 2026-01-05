<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { MasterCommand } from '~/types'

const kc = useKeycloak()
const router = useRouter()
const { t } = useI18n()
const { notifyError, notifySuccess } = useNotify()
const selectedMachineId = ref()

interface CommandType {
  machineId: number
  id: number
  commandNo: number
}

interface CommandTypeMap {
  id: number
  name: string
  data: CommandType | null
  label: string
}

const changedCommandTypes = ref<CommandType[]>([])

const commandTypeMaps = reactive<CommandTypeMap[]>([
  { id: 101, name: 'tank1Request', data: null, label: t('tank1Request') },
  { id: 102, name: 'tank1Dosage1', data: null, label: t('tank1Dosage1') },
  { id: 103, name: 'tank1Dosage2', data: null, label: t('tank1Dosage2') },
  { id: 201, name: 'tank2Request', data: null, label: t('tank2Request') },
  { id: 202, name: 'tank2Dosage1', data: null, label: t('tank2Dosage1') },
  { id: 203, name: 'tank2Dosage2', data: null, label: t('tank2Dosage2') },
  { id: 301, name: 'tank3Request', data: null, label: t('tank3Request') },
  { id: 302, name: 'tank3Dosage1', data: null, label: t('tank3Dosage1') },
  { id: 303, name: 'tank3Dosage2', data: null, label: t('tank3Dosage2') },
])

const { data: machines } = useAuthFetch('/api/machines/active-machines')
const { data: commandOptions } = useAuthFetch('/api/master-commands/master-commands', {
  query: { machineId: selectedMachineId },
  immediate: false,
})
const { data: commands } = useAuthFetch('/api/smart-request-commands/smart-request-commands', {
  query: { machineId: selectedMachineId },
  immediate: false,
})

watch(commandOptions, () => {
  commandOptions.value?.unshift({
    commandNo: -1,
    commandName: t('empty'),
  })
})

watch(commands, (_newValue, _oldValue) => {
  for (const commandTypeMap of commandTypeMaps) {
    commandTypeMap.data = commands.value?.find(t => t.commandType === Number(commandTypeMap.id))?.commandName || t('empty')
  }
})

async function handleOptionChange(commandTypeName: string) {
  const command = commandTypeMaps.find(c => c.name === commandTypeName)
  if (command && command.data)
    changedCommandTypes.value.push({ machineId: selectedMachineId.value, id: command.id, commandNo: command.data.commandNo })
}

async function handleSubmit() {
  try {
    await kc.fetch('/api/smart-request-commands/smart-request-commands', {
      method: 'PUT',
      body: { changedCommandTypes: changedCommandTypes.value },
    })
    changedCommandTypes.value = []
    notifySuccess(t('smartRequestCommandsSaved'))
  } catch (error: any) {
    if (error?.statusCode === 409 && error?.statusMessage === 'COMMAND_ID_INUSE') {
      notifyError(t('commandIdInUse'))
    } else
      notifyError(error?.message || t('smartRequestCommandsSaveError'))
  }
}
</script>

<template>
  <q-card class="h-[calc(100vh-41px)] flex flex-col">
    <q-card-section class="flex flex-1 flex-col p-6">
      <div class="flex flex-1 flex-wrap justify-center gap-6 min-h-0 lg:flex-nowrap">
        <div class="flex w-full max-w-[320px] flex-1 flex-col rounded-xl border border-black/10 bg-black/5 p-4 min-h-0">
          <h3 class="mb-3 text-lg font-semibold">
            {{ t('machines') }}
          </h3>
          <q-list
            bordered
            separator
            class="max-h-[520px] flex-1 overflow-auto"
          >
            <q-item
              v-for="machine in machines"
              :key="machine.machineId"
              v-ripple
              dense
              clickable
              :active="selectedMachineId === machine.machineId"
              :focused="selectedMachineId === machine.machineId"
              @click="selectedMachineId = machine.machineId"
            >
              <q-item-section>
                {{ machine.machineCode }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div
          v-if="commandOptions"
          class="flex w-full max-w-[420px] flex-1 flex-col rounded-xl border border-black/10 bg-black/5 p-4 min-h-0"
        >
          <h3 class="mb-3 text-lg font-semibold">
            {{ t('smartRequestCommandDefinitions') }}
          </h3>
          <div class="flex flex-1 flex-col gap-3 overflow-auto pr-1">
            <div
              v-for="commandMap in commandTypeMaps"
              :key="commandMap.id"
              class="min-w-0"
            >
              <q-select
                v-model="commandMap.data"
                dense
                :label="commandMap.label"
                :options="commandOptions"
                option-label="commandName"
                option-value="commandNo"
                @update:model-value="handleOptionChange(commandMap.name)"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator inset class="mx-6" />

    <q-card-actions class="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
      <q-btn
        :label="t('cancel')"
        @click="router.go(0)"
      />
      <q-btn
        color="primary"
        no-caps
        :label="t('submit')"
        @click="handleSubmit"
      />
    </q-card-actions>
  </q-card>
</template>
