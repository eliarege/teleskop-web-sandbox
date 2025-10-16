<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { withBase } from 'ufo'
import { type DialogChainObject, QLinearProgress } from 'quasar'
import { last } from 'lodash-es'
import AddEditModal from '../components/AddEditModal.vue'
import type { Machine, MachineGroup, MachineTableColumn } from '~/types'
import { steamUnitOptions, tbbModelOptions } from '~/server/utils/constants'

type SseEvent = 'log' | 'uuid' | 'error' | 'error-log' | 'start' | 'reset'

interface SseLog {
  type: SseEvent
  message: string
  rawMessage: string

  progress: number
}

const kc = useKeycloak()
const { dialog } = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyError } = useNotify()
const baseURL = useRuntimeConfig().app.baseURL
const loadingProjectTranslations = ref(false)

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

const uuid = ref('')

interface LogContext {
  logs: SseLog[]
  fullLogs: SseLog[]
  logDialog: DialogChainObject | null
  showFullLogDialog: boolean
}

const projectContext: LogContext = reactive({
  logs: [],
  fullLogs: [],
  logDialog: null,
  showFullLogDialog: false,
} as LogContext)

const versionContext: LogContext = reactive({
  logs: [],
  fullLogs: [],
  logDialog: null,
  showFullLogDialog: false,
} as LogContext)

const currentOperation = ref<'project' | 'version' | null>(null)

const { event, data, close } = useEventSource(withBase('/api/sync/sse', baseURL), ['log', 'uuid', 'error', 'error-log', 'start', 'reset'], {
  autoReconnect: true,
})

onBeforeUnmount(() => {
  close()
})

const percentage = ref(0)

function parseMessage(message?: string) {
  if (!message)
    return ''
  const regex = /^version-check-(started|failed|completed)-(\d+)$/
  const match = message.match(regex)

  if (match) {
    return t(`version-check-${match[1]}`, { machineId: match[2] })
  }

  return t(message)
}

const sseErrMessage = ref('')
const sseErrLogMessage = ref('')
const hasError = ref(false)

watch(data, (newData) => {
  if (newData) {
    const parsedData = JSON.parse(newData)
    const sseData = {
      type: event.value as SseEvent,
      message: parseMessage(parsedData.message),
      rawMessage: parsedData.message,
      progress: parsedData.progress,
    }

    if (sseData.type === 'uuid') {
      uuid.value = parsedData.uuid
      return
    }

    if (sseData.type === 'error-log') {
      sseErrLogMessage.value = sseData.message
    }

    if (sseData.type === 'error') {
      hasError.value = true
      sseErrMessage.value = t(sseData.message)
      if (currentOperation.value === 'project') {
        handleSseLogs(projectContext, sseData)
      } else if (currentOperation.value === 'version') {
        handleSseLogs(versionContext, sseData)
      }
      return
    }

    if (currentOperation.value === 'project') {
      handleSseLogs(projectContext, sseData)
    } else if (currentOperation.value === 'version') {
      handleSseLogs(versionContext, sseData)
    }
  }
})

function showSseLogs(ctx: LogContext) {
  ctx.logDialog = dialog({
    message: currentOperation.value === 'project'
      ? t('startingProjectUpload')
      : t('startingVersionUpdate'),
    progress: {
      spinner: h(QLinearProgress, {
        color: 'primary',
        value: percentage.value,
      }),
    },
    persistent: true,
    ok: false,
  }).onCancel(() => {
    ctx.logs = []
    percentage.value = 0
    currentOperation.value = null
  })
}

function handleSseLogs(ctx: LogContext, sseData: SseLog) {
  if (sseData.type === 'reset') {
    ctx.logs = []
  }
  if (sseData.type !== 'error-log') {
    ctx.logs.push(sseData)
    percentage.value = sseData.progress / 100

    if (ctx.logDialog) {
      ctx.logDialog.update({
        message: last(ctx.logs)?.message,
        progress: {
          spinner: h(QLinearProgress, {
            color: 'primary',
            value: percentage.value,
          }),
        },
      })

      if (sseData.rawMessage === 'NETWORK_CONN_FAILED') {
        ctx.logDialog?.update({
          cancel: {
            label: t('dismiss'),
          },
        })
      }
      if (percentage.value === 1) {
        ctx.fullLogs = ctx.logs
          .filter(l => l.type !== 'start')
          .toSorted((a, b) => a.progress > b.progress ? 1 : 0)
        setTimeout(() => {
          ctx.logDialog?.hide()
          ctx.logDialog = null
          ctx.showFullLogDialog = true
          percentage.value = 0
          currentOperation.value = null
        }, 350)
      }
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
    },
    cancel: {
      label: t('cancel'),
    },
  }).onOk(async () => {
    await kc.fetch('/api/machines/machine', {
      method: 'DELETE',
      body: {
        machineIds: selected.value.map(d => d.machineId),
      },
    })
    await refresh()
  })
}

const showTeleskopSettings = ref(false)

const keys = useMagicKeys()

whenever(keys.shift_alt_t, () => {
  showTeleskopSettings.value = true
})

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
    name: 'reelCount',
    label: t('reelCount'),
    field: 'reelCount',
    align: 'left',
  },
  {
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
      isEdit: false,
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
      isEdit: true,
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
  if (!uuid.value) {
    notifyError(t('connectionNotReady'))
    return
  }

  currentOperation.value = 'project'

  showSseLogs(projectContext)
  try {
    await kc.fetch('/api/sync/network-connection', {
      method: 'POST',
      retry: false,
      body: {
        uuid: uuid.value,
        ip: selected.value[0].ip,
        tbbModel: selected.value[0].tbbModel,
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
    console.error(error)
    currentOperation.value = null
  }
}

async function loadProjectTranslations() {
  const machineId = selected.value[0].machineId

  if (!machineId) {
    return
  }
  try {
    loadingProjectTranslations.value = true
    await kc.fetch('/api/sync/project-translations', {
      method: 'POST',
      body: { machineId },
    })
    notifySuccess(t('projectTranslationsLoadedSuccessfully'))
  } catch (error: any) {
    notifyError(`${t('errorloadingProjectTranslationsTranslations')}: ${error?.message}`)
  } finally {
    loadingProjectTranslations.value = false
  }
}

async function receiveVersionInfo() {
  if (!uuid.value) {
    notifyError(t('connectionNotReady'))
    return
  }

  try {
    currentOperation.value = 'version'

    showSseLogs(versionContext)
    await kc.fetch('/api/sync/machine-versions', {
      query: { sseId: uuid.value },
    })
    await refresh()
    selected.value = []
  } catch (error: any) {
    notifyError(t('errorReceivingVersionInfo', { error: error.message }))
    currentOperation.value = null
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
          :disable="selected.length !== 1 || loadingProjectTranslations"
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
          :disable="selected.length !== 1 || loadingProjectTranslations"
          @click="loadProject"
        />
        <q-btn
          no-caps
          push
          color="primary"
          :label="t('loadProjectTranslations')"
          :disable="selected.length !== 1"
          :loading="loadingProjectTranslations"
          @click="loadProjectTranslations"
        />
        <q-btn
          :label="t('receiveVersionInfo')"
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
    <MachineList
      v-model:selected="selected"
      :rows="modifiedMachines"
      :columns="columns"
      :machine-groups="machineGroups"
      form-class="grid grid-cols-5 gap-4 grid-rows-7 select-none"
    />
    <SseLogDialog
      :model-value="projectContext.showFullLogDialog"
      :logs="projectContext.fullLogs"
      :err-message="sseErrLogMessage"
      @close="projectContext.showFullLogDialog = false"
    />
    <SseLogDialog
      :model-value="versionContext.showFullLogDialog"
      :logs="versionContext.fullLogs"
      :err-message="sseErrLogMessage"
      @close="versionContext.showFullLogDialog = false"
    />
    <TeleskopSettingsDialog
      v-if="showTeleskopSettings"
      :show="showTeleskopSettings"
      form-class=""
      @close="showTeleskopSettings = false"
    />
  </div>
</template>
