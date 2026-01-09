<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { withQuery } from 'ufo'
import AddEditModal from '../components/AddEditModal.vue'
import type { Machine, MachineGroup, MachineTableColumn } from '~/types'

const kc = useKeycloak()
const { dialog } = useQuasar()
const { t } = useI18n()
const { notifySuccess, notifyError } = useNotify()
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

async function handleAdd(data: Machine) {
  await kc.fetch('/api/machines/machine', {
    method: 'POST',
    body: data,
  })
  await refresh()
}

async function handleEdit(id: number, data: Machine) {
  await kc.fetch('/api/machines/machine', {
    method: 'PUT',
    body: { id, data },
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

const anyMachineHasReels = computed(() => {
  return machines.value.some(m => m.reelCount > 0)
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
    visible: anyMachineHasReels,
  },
  {
    name: 'ip',
    label: t('ip'),
    field: 'ip',
    align: 'left',
  },
  {
    name: 'inUse',
    label: t('inUse'),
    field: 'inUse',
    align: 'left',
  },
  {
    name: 'plcModel',
    label: t('plcModel'),
    field: 'plcModel',
    align: 'left',
  },
] as MachineTableColumn[])

function showAddModal() {
  dialog({
    component: AddEditModal,
    componentProps: {
      title: t('addMachine'),
      isEdit: false,
      machineGroups: machineGroups.value.map(m => ({ label: m.groupName, value: m.groupId })),
      mtTempIoOptions: [],
      steamValveDoOptions: [],
      machines: machines.value,
    },
  }).onOk((payload: { data: Machine }) => {
    handleAdd(payload.data)
  })
}
function showEditModal(machine: Machine) {
  dialog({
    component: AddEditModal,
    componentProps: {
      title: t('editMachine'),
      initialData: machine,
      isEdit: true,
      machineGroups: machineGroups.value.map(m => ({ label: m.groupName, value: m.groupId })),
      mtTempIoOptions: machine.MTOptions.map(o => ({
        label: o.name,
        value: o.id,
        machineId: machine.machineId,
      })),
      steamValveDoOptions: machine.steamValveOptions.map(s => ({
        label: s.ioName,
        value: s.ioId,
        machineId: machine.machineId,
      })),
      machines: machines.value,
    },
  }).onOk((payload: { id: number, data: Machine }) => {
    handleEdit(payload.id, payload.data)
  })
}

async function loadProject() {
  startTaskStream(withQuery(`/api/sync/update-machine`, {
    machineId: selected.value[0].machineId,
  }), {
    width: 800,
    statusTitles: {
      running: t('loadingProject'),
      success: t('loadingProjectSuccess'),
      failed: t('loadingProjectFailed'),
    },
    fetchOptions: {
      method: 'GET',
    },
  })
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
    notifyError(`${t('errorLoadingProjectTranslations')}: ${error?.message}`)
  } finally {
    loadingProjectTranslations.value = false
  }
}

async function receiveVersionInfo() {
  startTaskStream(`/api/sync/machine-versions`, {
    statusTitles: {
      running: t('receivingVersionInfo'),
      success: t('versionInfoReceived'),
      failed: t('errorReceivingVersionInfo'),
    },
    fetchOptions: {
      method: 'GET',
    },
  })
}
</script>

<template>
  <div class="actions border-b dark:border-dark-4 overflow-hidden">
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
          @click="showEditModal(selected[0])"
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
      <q-chip class="self-end my-auto mr-4" :ripple="false">
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
      @machine-dblclick="showEditModal($event)"
    />
    <TeleskopSettingsDialog
      v-if="showTeleskopSettings"
      :show="showTeleskopSettings"
      form-class=""
      @close="showTeleskopSettings = false"
    />
  </div>
</template>

<style scoped>
.actions {
  height: 68px;
}
</style>
