<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { withBase } from 'ufo'
import { QLinearProgress } from 'quasar'
import AddEditModal from '../components/AddEditModal.vue'
import type { IContextMenuOption } from '~/components/ContextMenu.vue'
import type { IOOption, Machine, MachineGroup, MachineTableColumn } from '~/types'
import { steamUnitOptions, tbbModelOptions } from '~/server/utils/constants'

interface sseLog {
  message: string
  type: 'info' | 'log' | 'error' | 'ping' | 'start' | 'reset'
  progress: number
}
const kc = useKeycloak()
const { dialog, notify } = useQuasar()
const { t } = useI18n()
const { notifyError } = useNotify()
const baseURL = useRuntimeConfig().app.baseURL

const { data: databaseVersion } = useAuthFetch('/api/machines/database-version', {
  default: () => '',
})

const { data: machineGroups } = await useAuthFetch<MachineGroup[]>('/api/machines/machine-groups', {
  default: () => [],
})
const { data: machines, refresh } = useAuthFetch<Machine[]>('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const modifiedMachines = computed(() => machines.value.map(m => ({
  ...m,
  MTTempIoName: m.MTOptions.find(o => o.id === m.MTTempIo)?.name || '',
  steamValveDoName: m.steamValveOptions.find(s => s.ioId === m.steamValveDo)?.ioName || '',
})))

const selected = ref([] as Machine[])

const showMachineParameters = ref(false)
const showMimic = ref(false)
const showGetDyeHouseDefinitions = ref(false)
const showSetDyeHouseDefinitions = ref(false)

const logs = ref<sseLog[]>([])
const fullSseLogs = ref<sseLog[]>([])
const lastLog = ref<sseLog>()
const uuid = ref('')

const { event, data, close } = useEventSource(withBase('/api/sync/sse', baseURL), ['log', 'uuid', 'error', 'start', 'reset'], {
  autoReconnect: true,
})
onBeforeUnmount(() => {
  close()
})

const percentage = ref(0)
const showSseLogDialog = ref<any>(null)
const showFullSseLogDialog = ref<boolean>(false)

const closeButtonVisible = ref(false)
let closeButtonTimer: NodeJS.Timeout | null = null

watch(data, (newData) => {
  if (newData) {
    const parsedData = JSON.parse(newData)

    const sseData = {
      type: event.value,
      message: parsedData.message,
      progress: parsedData.progress,
    }

    if (sseData.type === 'reset') {
      logs.value = []
    }

    if (sseData.type === 'uuid') {
      uuid.value = parsedData.uuid
    }

    logs.value.push(sseData)

    lastLog.value = {
      type: sseData.type,
      message: sseData.message,
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

      if (closeButtonTimer)
        clearTimeout(closeButtonTimer)
      if (sseData.message === 'NETWORK_CONN_FAILED')
        closeButtonTimer = setTimeout(() => {
          showSseLogDialog.value.update({
            cancel: {
              label: t('dismiss'),
            },
          })
        }, 1700)
      if (percentage.value === 1) {
        fullSseLogs.value = logs.value.filter(l => l.type !== 'start').sort((a, b) => a.progress > b.progress ? 1 : 0)
        setTimeout(() => {
          showSseLogDialog.value?.hide()
          showSseLogDialog.value = null
          showFullSseLogDialog.value = !showFullSseLogDialog.value
          percentage.value = 0
          closeButtonVisible.value = false
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
    body: { formData },
  })
  await refresh()
}

async function handleDelete() {
  dialog({
    title: t('deleteMachines'),
    message: t('confirmDeleteMachines', { count: selected.value.length }),
    ok: {
      label: t('delete'),
      color: 'negative',
      handler: async () => {
        await kc.fetch('/api/machines/machine', {
          method: 'DELETE',
          body: {
            machineIds: selected.value.map(d => d.machineId),
          },
        })
        await refresh()
      },
    },
    cancel: {
      label: t('cancel'),
    },
  })
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
    disabled: selected.value.length !== 1,
    onClick: () => {
      copy.value = selected.value[0].machineId
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: selected.value.length !== 1 || !copy.value,
    onClick: async () => {
      await kc.fetch('/api/io/copy', {
        method: 'POST',
        body: {
          sourceMachineId: copy.value,
          targetMachineId: selected.value[0].machineId,
        },
      })
    },
  },
  {
    label: 'Mimic',
    category: 'edit',
    disabled: selected.value.length !== 1,
    onClick: () => showMimic.value = true,
  },
  {
    label: t('machineConstants'),
    category: 'edit',
    disabled: selected.value.length !== 1,
    onClick: () => showMachineParameters.value = true,
  },
  {
    label: t('formulas'),
    category: 'edit',
    disabled: selected.value.length !== 1,
    onClick: async () => {
      await navigateTo({
        path: `/formulas/${selected.value[0].machineId}`,
      })
    },
  },
  {
    label: t('setDyeHouseDefinitions'),
    category: 'edit',
    disabled: selected.value.length === 0,
    onClick: () => showSetDyeHouseDefinitions.value = true,
  },
  {
    label: t('getDyeHouseDefinitions'),
    category: 'edit',
    disabled: selected.value.length === 0,
    onClick: () => showGetDyeHouseDefinitions.value = true,
  },
])

const columns = ref([
  {
    name: 'machineId',
    label: '#',
    field: 'machineId',
    align: 'left',
  },
  {
    name: 'machineCode',
    label: t('machineCode'),
    field: 'machineCode',
    align: 'left',
  },
  {
    name: 'groupName',
    label: t('group'),
    field: 'groupName',
    align: 'left',
  },
  {
    name: 'tbbModel',
    label: t('tbbModel'),
    field: 'tbbModel',
    align: 'left',
  },
  {
    name: 'plcModel',
    label: t('plcModel'),
    field: 'plcModel',
    align: 'left',
  },
  {
    name: 'ip',
    label: t('ip'),
    field: 'ip',
    align: 'left',
  },
  {
    name: 'theoricalCharge',
    label: t('theoricalCharge'),
    field: 'theoricalCharge',
    align: 'left',
  },
  {
    name: 'theoricalChargeDuration',
    label: t('theoricalChargeDuration'),
    field: 'theoricalChargeDuration',
    align: 'left',
  },
  {
    name: 'machineCapacity',
    label: t('machineCapacity'),
    field: 'machineCapacity',
    align: 'left',
  },
  {
    // kule sayısı
    name: 'reelCount',
    label: t('reelCount'),
    field: 'reelCount',
    align: 'left',
  },
  {
    // düze sayısı
    name: 'nozzleCount',
    label: t('nozzleCount'),
    field: 'nozzleCount',
    align: 'left',
  },
  {
    name: 'steamUnit',
    label: t('steamUnit'),
    field: 'steamUnit',
    align: 'left',
  },
  {
    name: 'steamKgPerHour',
    label: t('steamKgPerHour'),
    field: 'steamKgPerHour',
    align: 'left',
  },
  {
    name: 'additionalTank1',
    label: t('additionalTank1'),
    field: 'additionalTank1',
    align: 'left',
  },
  {
    name: 'additionalTank2',
    label: t('additionalTank2'),
    field: 'additionalTank2',
    align: 'left',
  },
  {
    name: 'additionalTank3',
    label: t('additionalTank3'),
    field: 'additionalTank3',
    align: 'left',
  },
  {
    name: 'additionalTank4',
    label: t('additionalTank4'),
    field: 'additionalTank4',
    align: 'left',
  },
  {
    name: 'reserveTank',
    label: t('reserveTank'),
    field: 'reserveTank',
    align: 'left',
  },
  {
    name: 'inUse',
    label: t('inUse'),
    field: 'inUse',
    align: 'left',
  },
  {
    // ana kazan sıcaklık girişi
    name: 'MTTempIo',
    label: t('MTTempIo'),
    field: 'MTTempIoName',
    align: 'left',
  },
  {
    name: 'version',
    label: t('version'),
    field: 'version',
    align: 'left',
  },
  {
    name: 'productModel',
    label: t('productModel'),
    field: 'productModel',
    align: 'left',
  },
  {
    name: 'hardwareModel',
    label: t('hardwareModel'),
    field: 'hardwareModel',
    align: 'left',
  },
  {
    name: 'steamValveDo',
    label: t('steamValveDo'),
    field: 'steamValveDoName',
    align: 'left',
  },
  {
    name: 'theoreticalSteam',
    label: t('theoreticalSteam'),
    field: 'theoreticalSteam',
    align: 'left',
  },
] as MachineTableColumn[])

function showAddModal() {
  dialog({
    component: AddEditModal,
    componentProps: {
      title: t('addMachine'),
      modelValue: {},
      onSubmit: (e: Machine) => handleAdd(e),
      tbbModelOptions,
      steamUnitOptions,
      machineGroups: machineGroups.value.map(m => ({ label: m.groupName, value: m.groupId })),
      mtTempIoOptions: [],
      steamValveDoOptions: [],
    },
    persistent: true,
  })
}
function showEditModal() {
  const selectedMachine = selected.value[0]
  dialog({
    component: AddEditModal,
    componentProps: {
      title: t('editMachine'),
      modelValue: selectedMachine,
      onSubmit: (e: Machine) => handleEdit(e),
      tbbModelOptions,
      steamUnitOptions,
      machineGroups: machineGroups.value.map(m => ({ label: m.groupName, value: m.groupId })),
      mtTempIoOptions: selectedMachine.MTOptions.map(o => ({
        label: o.name,
        value: o.id,
        machineId: selectedMachine.machineId,
      })),
      steamValveDoOptions: selectedMachine.steamValveOptions.map(s => ({
        label: s.ioName,
        value: s.ioId,
        machineId: selectedMachine.machineId,
      })),
    },
    persistent: true,
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
        ip: selected.value[0].ip,
      },
    })

    await kc.fetch('/api/sync/update-machine', {
      method: 'GET',
      retry: false,
      query: {
        machineId: selected.value[0].machineId,
        sseId: uuid.value,
      },
    })
  } catch (error: any) {
    if (error.statusCode === 500) {
      notifyError(t('errorLoadingProject'))
    } else if (error.statusCode === 504) {
      notifyError(t('connectionTimeout'))
    }
  }
}
async function receiveVersionInfo() {
  try {
    notify({
      message: t('receivingVersionInfo'),
      color: 'primary',
      position: 'top',
      timeout: 1000,
    })
    await kc.fetch('/api/sync/machine-versions')
    await refresh()
    selected.value = []
    notify({
      message: t('versionInfoReceived'),
      color: 'green',
      position: 'top',
      timeout: 2000,
    })
  } catch (error: any) {
    notifyError(t('errorReceivingVersionInfo', { error: error.message }))
  }
}
</script>

<template>
  <div class="actions">
    <div class="flex justify-between items-center grow">
      <div class="flex gap-4 m-4">
        <q-btn
          no-caps
          push
          color="primary"
          :label="t('add')"
          @click="showAddModal"
        />
        <q-btn
          no-caps
          push
          color="primary"
          :label="t('edit')"
          :disable="selected.length !== 1"
          @click="showEditModal"
        />
        <q-btn
          no-caps
          push
          color="primary"
          :disable="selected.length === 0"
          :label="t('delete')"
          @click="handleDelete"
        />
        <q-btn
          no-caps
          push
          color="primary"
          :label="t('loadProject')"
          :disable="selected.length !== 1"
          @click="loadProject"
        />
        <q-btn
          :label="t('receiveVersionInfo')"
          :disable="selected.length !== 1"
          no-caps
          push
          color="primary"
          @click="receiveVersionInfo"
        />
      </div>
      <q-chip class="self-end">
        {{ `DB v${databaseVersion}` }}
      </q-chip>
    </div>
  </div>
  <div>
    <ContextMenu
      :context-menu-options="contextMenuOptions"
      target=".q-table"
      @click="(option: IContextMenuOption) => option.onClick(selected)"
    />
    <MachineList
      v-model:selected="selected"
      :rows="modifiedMachines"
      :columns="columns"
      :machine-groups="machineGroups"
      form-class="grid grid-cols-5 gap-4 grid-rows-7 select-none"
    />
    <SseLogDialog
      :model-value="showFullSseLogDialog"
      :logs="fullSseLogs"
      @close="showFullSseLogDialog = false"
    />
    <TeleskopSettingsDialog
      v-if="showTeleskopSettings"
      :show="showTeleskopSettings"
      form-class=""
      @close="showTeleskopSettings = false"
    />
    <GetDyeHouseDefinitionsDialog
      v-if="showGetDyeHouseDefinitions && selected[0]"
      :show="showGetDyeHouseDefinitions"
      :selected="selected[0] as Machine"
      @close="showGetDyeHouseDefinitions = false"
    />
    <SetDyeHouseDefinitionsDialog
      v-if="showSetDyeHouseDefinitions && selected[0]"
      :show="showSetDyeHouseDefinitions"
      :selected="selected[0] as Machine"
      @close="showSetDyeHouseDefinitions = false"
    />
    <MachineParametersDialog
      v-if="showMachineParameters"
      :show="showMachineParameters"
      :selected="selected[0]"
      @close="showMachineParameters = false"
    />
    <MimicDialog
      v-if="showMimic"
      :show="showMimic"
      :selected="selected[0]"
      @close="showMimic = false"
    />
  </div>
</template>
