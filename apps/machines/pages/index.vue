<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { withBase } from 'ufo'
import type { IContextMenuOption } from '~/components/ContextMenu.vue'
import { steamUnitOptions, tbbModelOptions } from '~/server/utils/constants'
import type { Machine, MachineGroup } from '~/types'

interface sseLog {
  message: string
  type?: 'info' | 'error'
}

interface Option {
  label: string
  value: number
}

const { t, locale, setLocale } = useI18n()
const baseURL = useRuntimeConfig().app.baseURL

const { data: databaseVersion } = useLazyFetch('/api/machines/database-version', {
  default: () => '',
})

const { data: machineGroups } = useLazyFetch('/api/machines/machine-groups', {
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

const columns = computed(() => ({
  machineId: {
    label: 'ID',
    field: 'machineId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    unique: true,
    type: 'number',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required|min:1',
    },
  },
  machineCode: {
    label: t('machineName'),
    field: 'machineCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  groupNo: {
    label: t('group'),
    field: 'groupNo',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: true,
    editable: true,
    format: (val: number) => machineGroups.value.find(d => d.value === val)?.label || val,
    schema: {
      validation: 'required',
      options: machineGroups.value,
    },
  },
  tbbModel: {
    label: 'Model',
    field: 'tbbModel',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
      options: tbbModelOptions,
    },
  },
  version: {
    label: t('version'),
    field: 'version',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: false,
    schema: {
      filled: true,
    },
  },
  machineCapacity: {
    label: t('machineCapacity'),
    field: 'machineCapacity',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required|min:1',
    },
  },
  reelCount: {
    label: t('reelCount'),
    field: 'reelCount',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'min:1',
    },
  },
  nozzleCount: {
    label: t('nozzleCount'),
    field: 'nozzleCount',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: false,
    editable: true,
    schema: {
      filled: true,
      validation: 'min:1',
    },
  },
  ip: {
    label: 'Ip',
    field: 'ip',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  plcModel: {
    label: t('plcModel'),
    field: 'plcModel',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: false,
    schema: {
      filled: true,
    },
  },

  ////
  theoricalCharge: {
    label: t('theoricalCharge'),
    field: 'theoricalCharge',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: false,
    editable: true,
    schema: {
      filled: true,
      validation: 'required|min:1',
    },
  },
  theoricalChargeDuration: {
    label: t('theoricalChargeDuration'),
    field: 'theoricalChargeDuration',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: false,
    editable: true,
    schema: {
      filled: true,
      validation: 'min:1',
    },
  },
  steamUnit: {
    label: t('steamUnit'),
    field: 'steamUnit',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: false,
    editable: true,
    schema: {
      filled: true,
      options: steamUnitOptions,
    },
  },
  inUse: {
    label: t('inUse'),
    field: 'inUse',
    align: 'left',
    type: 'checkbox',
    visible: true,
    editable: true,
    format: (val: boolean) => val ? t('yes') : t('no'),
    schema: {
      filled: true,
    },
  },
  additionalTank1: {
    label: t('additionalTank1'),
    field: 'additionalTank1',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  additionalTank2: {
    label: t('additionalTank2'),
    field: 'additionalTank2',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  additionalTank3: {
    label: t('additionalTank3'),
    field: 'additionalTank3',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  additionalTank4: {
    label: t('additionalTank4'),
    field: 'additionalTank4',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  reserveTank: {
    label: t('reserveTank'),
    field: 'reserveTank',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  storeElectricityAsInc: {
    label: t('storeElectricityAsInc'),
    field: 'storeElectricityAsInc',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  theoreticalWater: {
    label: t('theoreticalWaterCalculationActive'),
    field: 'theoreticalWater',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  MTTempIo: {
    label: t('MTTempIo'),
    field: 'MTTempIo',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: false,
    editable: true,
    schema: {
      filled: true,
      validation: 'min:1',
    },
  },
  theoreticalSteam: {
    label: t('theoreticalSteam'),
    field: 'theoreticalSteam',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  steamKgPerHour: {
    label: t('steamKgPerHour'),
    field: 'steamKgPerHour',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: false,
    editable: true,
    schema: {
      filled: true,
      validation: 'min:1',
    },
  },
  steamValveDo: {
    label: t('steamValveDo'),
    field: 'steamValveDo',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: false,
    editable: true,
    schema: {
      filled: true,
      validation: 'min:1',
    },
  },
}))

const { data: machines, refresh } = useLazyFetch<Machine[]>('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
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
  await $fetch('/api/sync/machine-versions')
  await refresh()
}

const { event, data, close } = useEventSource(withBase('/api/sync/sse', baseURL), ['log', 'uuid'], {
  autoReconnect: true,
})

onBeforeUnmount(() => {
  close()
})

const logs = ref<sseLog[]>([])
const uuid = ref('')

watch(data, (newData) => {
  if (event.value === 'log' && newData) {
    const parsedData = JSON.parse(newData)
    logs.value.push(parsedData)
  } else if (event.value === 'uuid' && newData) {
    const parsedData = JSON.parse(newData)
    uuid.value = parsedData.uuid
  }
})

const { notifySuccess, notifyError } = useNotify()

async function loadProject() {
  try {
    await $fetch('/api/sync/network-connection', {
      method: 'GET',
      retry: false,
      query: {
        ip: selected.value.ip,
      },
    })
    notifySuccess(t('connectionSuccessful'))

    await $fetch('/api/sync/update-machine', {
      method: 'GET',
      retry: false,
      query: {
        machineId: selected.value.machineId,
        sseId: uuid.value,
      },
    })
    notifySuccess(t('updateFinished'))
  } catch (error: any) {
    if (error.statusCode === 500) {
      notifyError(t('errorLoadingProject'))
    } else if (error.statusCode === 504) {
      notifyError(t('connectionTimeout'))
    }
  }
}

async function handleAdd(formData: Machine) {
  await $fetch('/api/machines/machine', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData: Machine) {
  await $fetch('/api/machines/machine', {
    method: 'PUT',
    body: {
      machine: formData,
      machineId: selected.value.machineId,
    },
  })
  await refresh()
}

async function handleDelete(formData: Machine[]) {
  await $fetch('/api/machines/machine', {
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
      await $fetch('/api/io/copy', {
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
    await $fetch('/api/sync/teleskop-connection', {
      method: 'GET',
      retry: false,
      query: {
        ip: formData.ip,
      },
    })
    teleskopConnectionMessage.value.message = t('connectionSuccessful')
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
    await $fetch('/api/sync/network-connection', {
      method: 'GET',
      retry: false,
      query: {
        ip: formData.ip,
      },
    })
    networkConnectionMessage.value.message = (t('connectionSuccessful'))
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
</script>

<template>
  <div>
    <ContextMenu
      :context-menu-options="contextMenuOptions"
      target=".q-table"
      @click="(option: IContextMenuOption) => option.onClick(selected)"
    />
    <div class="absolute left-63 top-13.2">
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
    <div class="flex absolute right-10 top-13.2">
      <q-chip>
        {{ `DB v${databaseVersion}` }}
      </q-chip>
      <q-option-group
        :model-value="locale"
        type="radio"
        :options="[
          { label: 'Türkçe', value: 'tr' },
          { label: 'English', value: 'en' },
        ]"
        class="flex"
        @update:model-value="setLocale($event)"
      />
    </div>
    <FormTableKit
      :rows="machines"
      :columns="columns"
      form-class="grid grid-cols-5 gap-4 grid-rows-7 h-160"
      @add="handleAdd"
      @edit="handleEdit"
      @select="handleSelection"
      @delete="handleDelete"
      @close="handleClose"
    >
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
    </FormTableKit>

    <q-scroll-area style="height: 200px">
      <div
        v-for="(log, index) in logs"
        :key="index"
        :class="log.type === 'error' ? 'text-red pl-2' : 'pl-2'"
      >
        {{ log.message }}
      </div>
    </q-scroll-area>

    <TeleskopSettingsDialog
      v-if="showTeleskopSettings"
      :show="showTeleskopSettings"
      form-class=""
      @close="showTeleskopSettings = false"
    />
    <GetDyeHouseDefinitionsDialog
      v-if="showGetDyeHouseDefinitions && selected"
      :show="showGetDyeHouseDefinitions"
      :selected="selected"
      @close="showGetDyeHouseDefinitions = false"
    />
    <SetDyeHouseDefinitionsDialog
      v-if="showSetDyeHouseDefinitions && selected"
      :show="showSetDyeHouseDefinitions"
      :selected="selected"
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
