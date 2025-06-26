<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { withBase } from 'ufo'
import { QLinearProgress } from 'quasar'
import type { IContextMenuOption } from '~/components/ContextMenu.vue'
import type { IOOption, Machine, MachineGroup, MachineTableColumn } from '~/types'

interface sseLog {
  message: string
  type: 'info' | 'log' | 'error' | 'ping'
}

interface Option {
  label: string
  value: number
}

const kc = useKeycloak()
const { t } = useI18n()
const baseURL = useRuntimeConfig().app.baseURL

const { data: databaseVersion } = useAuthFetch('/api/machines/database-version', {
  default: () => '',
})

const { data: machineGroups } = useAuthFetch('/api/machines/machine-groups', {
  default: () => [],
  transform: (machineGroups: MachineGroup[]) => {
    const options: Option[] = []
    machineGroups.forEach((group) => {
      options.push({
        label: group.groupName,
        value: group.groupId,
      })
    })
    return options
  },
})

const { data: MTTempIoOptions } = useAuthFetch<IOOption[]>('/api/machines/mt-temp-io-options', {
  default: () => [],
  transform: (MTTempIoOptions: IOOption[]) => {
    return MTTempIoOptions.map(io => ({
      machineId: io.machineId,
      label: io.ioName,
      value: io.ioId,
    }))
  },
})

const { data: steamValveDoOptions } = useAuthFetch<IOOption[]>('/api/machines/steam-valve-do-options', {
  default: () => [],
  transform: (steamValveDoOptions: IOOption[]) => {
    return steamValveDoOptions.map(io => ({
      machineId: io.machineId,
      label: io.ioName,
      value: io.ioId,
    }))
  },
})

const { data: machines, refresh } = useAuthFetch<Machine[]>('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const rows = ref<Machine[]>([])

watch(machines, (val) => {
  rows.value = val || []
})

const selected = ref<Partial<Machine>>({
  machineId: -1,
})

const showMachineParameters = ref(false)
const showMimic = ref(false)
const showGetDyeHouseDefinitions = ref(false)
const showSetDyeHouseDefinitions = ref(false)

function handleSelection(formData: Machine[]) {
  if (formData.length)
    selected.value = formData[0]
  else
    selected.value = {
      machineId: -1,
    }
}

async function updateVersions() {
  await kc.fetch('/api/sync/machine-versions')
  await refresh()
}

const logs = ref<sseLog[]>([])
const lastLog = ref<sseLog>()
const uuid = ref('')

const { event, data, close } = useEventSource(withBase('/api/sync/sse', baseURL), ['log', 'uuid', 'error'], {
  autoReconnect: true,
})
onBeforeUnmount(() => {
  close()
})

const { dialog } = useQuasar()
const percentage = ref(0)
const showSseLogDialog = ref<any>(null)
const showFullSseLogDialog = ref<boolean>(false)

watch(data, (newData) => {
  if (newData) {
    const sseData = {
      type: event.value,
      message: JSON.parse(newData).message,
      progress: JSON.parse(newData).progress,
    }

    if (sseData.type === 'uuid') {
      uuid.value = JSON.parse(newData).uuid
    }

    logs.value.push(sseData)

    lastLog.value = {
      type: sseData.type,
      message: t(sseData.message),
    }

    percentage.value = sseData.progress / 100

    if (showSseLogDialog.value) {
      showSseLogDialog.value.update({
        message: t(`${lastLog.value?.message}`),
        progress: {
          spinner: h(QLinearProgress, {
            color: 'primary',
            value: percentage.value,
          }),
        },
      })
      if (percentage.value === 1) {
        setTimeout(() => {
          showSseLogDialog.value?.hide()
          showSseLogDialog.value = null
          showFullSseLogDialog.value = !showFullSseLogDialog.value
          percentage.value = 0
        }, 350)
      }
    }
  }
})

function showSseLogs() {
  showSseLogDialog.value = dialog({
    message: `Starting Project Upload`,
    progress: {
      spinner: h(QLinearProgress, {
        color: 'primary',
        value: percentage.value,
      }),
    },
    persistent: true,
    ok: false,
  })
}

async function loadProject() {
  showSseLogs()
  try {
    await kc.fetch('/api/sync/network-connection', {
      method: 'POST',
      retry: false,
      body: {
        uuid: uuid.value,
        ip: selected.value.ip,
      },
    })

    await kc.fetch('/api/sync/update-machine', {
      method: 'GET',
      retry: false,
      query: {
        machineId: selected.value.machineId,
        sseId: uuid.value,
      },
    })
  } catch (error: any) {
    if (error.statusCode === 500) {
    // notifyError(t('errorLoadingProject'))
    } else if (error.statusCode === 504) {
      // notifyError(t('connectionTimeout'))
    }
  }
}

async function handleAdd(formData: Machine) {
  await kc.fetch('/api/machines/machine', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData: Machine) {
  await kc.fetch('/api/machines/machine', {
    method: 'PUT',
    body: {
      machine: formData,
      machineId: selected.value.machineId,
    },
  })
  await refresh()
}

async function handleDelete(formData: Machine[]) {
  await kc.fetch('/api/machines/machine', {
    method: 'DELETE',
    body: {
      machineIds: formData.map((d: Machine) => d.machineId),
    },
  })
  await refresh()
}

const showTeleskopSettings = ref(false)

const keys = useMagicKeys()

whenever(keys.shift_alt_t, () => {
  showTeleskopSettings.value = true
})

const copy = ref()

const contextMenuOptions = computed<Partial<IContextMenuOption>[]>(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: selected.value.machineId === -1,
    onClick: () => {
      copy.value = selected.value.machineId
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: selected.value.machineId === -1 || !copy.value,
    onClick: async () => {
      await kc.fetch('/api/io/copy', {
        method: 'POST',
        body: {
          sourceMachineId: copy.value,
          targetMachineId: selected.value.machineId,
        },
      })
    },
  },
  {
    label: 'Mimic',
    category: 'edit',
    disabled: selected.value.machineId === -1,
    onClick: () => showMimic.value = true,
  },
  {
    label: t('machineConstants'),
    category: 'edit',
    disabled: selected.value.machineId === -1,
    onClick: () => showMachineParameters.value = true,
  },
  {
    label: t('formulas'),
    category: 'edit',
    disabled: selected.value.machineId === -1,
    onClick: async () => {
      await navigateTo({
        path: `/formulas/${selected.value.machineId}`,
      })
    },
  },
  {
    label: t('setDyeHouseDefinitions'),
    category: 'edit',
    disabled: selected.value.machineId === -1,
    onClick: () => showSetDyeHouseDefinitions.value = true,
  },
  {
    label: t('getDyeHouseDefinitions'),
    category: 'edit',
    disabled: selected.value.machineId === -1,
    onClick: () => showGetDyeHouseDefinitions.value = true,
  },
])

const teleskopConnectionMessage = ref({
  message: '',
  color: '',
})

const networkConnectionMessage = ref({
  message: '',
  color: '',
})

async function checkTeleskopConnection(formData: Machine) {
  try {
    teleskopConnectionMessage.value.message = t('tryingConnection')
    teleskopConnectionMessage.value.color = ''
    await kc.fetch('/api/sync/teleskop-connection', {
      method: 'GET',
      retry: false,
      query: {
        ip: formData.ip,
      },
    })
    teleskopConnectionMessage.value.message = t('connection-successful')
    teleskopConnectionMessage.value.color = 'text-green'
  } catch (error: any) {
    console.error(error)
    if (error.statusCode === 500) {
      teleskopConnectionMessage.value.message = (t('noConnectionToTeleskop'))
      teleskopConnectionMessage.value.color = 'text-red'
    }
  }
}

async function checkNetworkConnection(formData: Machine) {
  try {
    networkConnectionMessage.value.message = t('tryingConnection')
    networkConnectionMessage.value.color = ''
    await kc.fetch('/api/sync/network-connection', {
      method: 'POST',
      retry: false,
      body: {
        ip: formData.ip,
      },
    })
    networkConnectionMessage.value.message = (t('connection-successful'))
    networkConnectionMessage.value.color = 'text-green'
  } catch (error: any) {
    console.error(error)
    if (error.statusCode === 500) {
      networkConnectionMessage.value.message = (t('noConnectionToNetwork'))
      networkConnectionMessage.value.color = 'text-red'
    }
  }
}

function handleClose() {
  teleskopConnectionMessage.value = { message: '', color: '' }
  networkConnectionMessage.value = { message: '', color: '' }
}

const columns = ref<MachineTableColumn[]>([
  {
    name: 'machineId',
    label: '#',
    field: 'machineId',
    sortable: true,
    align: 'left',
  },
  {
    name: 'machineCode',
    label: t('machineCode'),
    field: 'machineCode',
    sortable: true,
    align: 'left',
  },
  {
    name: 'groupName',
    label: t('group'),
    field: 'groupName',
    sortable: true,
    align: 'left',
  },
  {
    name: 'tbbModel',
    label: t('tbbModel'),
    field: 'tbbModel',
    sortable: true,
    align: 'left',
  },
  {
    name: 'plcModel',
    label: t('plcModel'),
    field: 'plcModel',
    sortable: true,
    align: 'left',
  },
  {
    name: 'ip',
    label: t('ip'),
    field: 'ip',
    sortable: true,
    align: 'left',
  },
  {
    name: 'theoricalCharge',
    label: t('theoricalCharge'),
    field: 'theoricalCharge',
    sortable: true,
    align: 'left',
  },
  {
    name: 'theoricalChargeDuration',
    label: t('theoricalChargeDuration'),
    field: 'theoricalChargeDuration',
    sortable: true,
    align: 'left',
  },
  {
    name: 'machineCapacity',
    label: t('machineCapacity'),
    field: 'machineCapacity',
    sortable: true,
    align: 'left',
  },
  {
    name: 'reelCount',
    label: t('reelCount'),
    field: 'reelCount',
    sortable: true,
    align: 'left',
  },
  {
    name: 'nozzleCount',
    label: t('nozzleCount'),
    field: 'nozzleCount',
    sortable: true,
    align: 'left',
  },
  {
    name: 'steamUnit',
    label: t('steamUnit'),
    field: 'steamUnit',
    sortable: true,
    align: 'left',
  },
  {
    name: 'steamKgPerHour',
    label: t('steamKgPerHour'),
    field: 'steamKgPerHour',
    sortable: true,
    align: 'left',
  },
  {
    name: 'additionalTank1',
    label: t('additionalTank1'),
    field: 'additionalTank1',
    sortable: true,
    align: 'left',
  },
  {
    name: 'additionalTank2',
    label: t('additionalTank2'),
    field: 'additionalTank2',
    sortable: true,
    align: 'left',
  },
  {
    name: 'additionalTank3',
    label: t('additionalTank3'),
    field: 'additionalTank3',
    sortable: true,
    align: 'left',
  },
  {
    name: 'additionalTank4',
    label: t('additionalTank4'),
    field: 'additionalTank4',
    sortable: true,
    align: 'left',
  },
  {
    name: 'reserveTank',
    label: t('reserveTank'),
    field: 'reserveTank',
    sortable: true,
    align: 'left',
  },
  {
    name: 'inUse',
    label: t('inUse'),
    field: 'inUse',
    sortable: true,
    align: 'left',
  },
  {
    name: 'MTTempIo',
    label: t('MTTempIo'),
    field: 'MTTempIo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'version',
    label: t('version'),
    field: 'version',
    sortable: true,
    align: 'left',
  },
  {
    name: 'productModel',
    label: t('productModel'),
    field: 'productModel',
    sortable: true,
    align: 'left',
  },
  {
    name: 'hardwareModel',
    label: t('hardwareModel'),
    field: 'hardwareModel',
    sortable: true,
    align: 'left',
  },
  {
    name: 'steamValveDo',
    label: t('steamValveDo'),
    field: 'steamValveDo',
    sortable: true,
    align: 'left',
  },
  {
    name: 'theoreticalSteam',
    label: t('theoreticalSteam'),
    field: 'theoreticalSteam',
    sortable: true,
    align: 'left',
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :context-menu-options="contextMenuOptions"
      target=".q-table"
      @click="(option: IContextMenuOption) => option.onClick(selected)"
    />
    <MachineList
      :rows="rows"
      :columns="columns"
      :machines="machines"
      :machine-groups="machineGroups"
      :mt-temp-io-options="MTTempIoOptions"
      :steam-valve-do-options="steamValveDoOptions"
      form-class="grid grid-cols-5 gap-4 grid-rows-7 select-none"
      @add="handleAdd"
      @edit="handleEdit"
      @select="handleSelection"
      @delete="handleDelete"
      @close="handleClose"
    >
      <template #actions>
        <div class="flex justify-between items-center grow">
          <div class="flex">
            <q-btn
              :label="t('loadProject')"
              no-caps
              push
              color="primary"
              :disable="selected.machineId === -1"
              class="mr-4"
              @click="loadProject"
            />
            <q-btn
              :label="t('receiveVersionInfo')"
              no-caps
              push
              color="primary"
              class="mr-4"
              @click="updateVersions"
            />
          </div>
          <q-chip class="self-end">
            {{ `DB v${databaseVersion}` }}
          </q-chip>
        </div>
      </template>
      <template #form-content="slotProps">
        <q-btn
          :label="t('checkTeleskopConnection')"
          color="primary"
          no-caps
          class="row-start-6"
          @click="checkTeleskopConnection(slotProps.formData)"
        />
        <q-btn
          :label="t('checkNetworkConnection')"
          color="primary"
          no-caps
          class="row-start-6"
          @click="checkNetworkConnection(slotProps.formData)"
        />
        <h3 :class="teleskopConnectionMessage.color" class="row-start-7">
          {{ teleskopConnectionMessage.message }}
        </h3>
        <h3 :class="networkConnectionMessage.color" class="row-start-7">
          {{ networkConnectionMessage.message }}
        </h3>
      </template>
    </MachineList>

    <SseLogDialog
      :model-value="showFullSseLogDialog"
      :logs
      @close="showFullSseLogDialog = false"
    />
    <TeleskopSettingsDialog
      v-if="showTeleskopSettings"
      :show="showTeleskopSettings"
      form-class=""
      @close="showTeleskopSettings = false"
    />
    <GetDyeHouseDefinitionsDialog
      v-if="showGetDyeHouseDefinitions && selected"
      :show="showGetDyeHouseDefinitions"
      :selected="selected as Machine"
      @close="showGetDyeHouseDefinitions = false"
    />
    <SetDyeHouseDefinitionsDialog
      v-if="showSetDyeHouseDefinitions && selected"
      :show="showSetDyeHouseDefinitions"
      :selected="selected as Machine"
      @close="showSetDyeHouseDefinitions = false"
    />
    <MachineParametersDialog
      v-if="showMachineParameters"
      :show="showMachineParameters"
      :selected="selected"
      @close="showMachineParameters = false"
    />
    <MimicDialog
      v-if="showMimic"
      :show="showMimic"
      :selected="selected"
      @close="showMimic = false"
    />
  </div>
</template>
