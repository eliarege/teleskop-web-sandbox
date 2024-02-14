<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { steamUnitOptions, tbbModelOptions } from '~/server/utils/constants'

const { t } = useI18n()

const { data: machineGroups } = useLazyFetch('/api/machines/machine-groups', {
  default: () => [],
  transform: (machineGroups) => {
    const options = []
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
      validation: 'required',
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
    format: (val, row) => machineGroups.value.find(d => d.value === val)?.label || val,
    schema: {
      validation: 'required',
      options: machineGroups.value,
    },
  },
  tbbModel: {
    label: t('model'),
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
    type: 'number',
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
      validation: 'required',
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
    },
  },
  ip: {
    label: t('ip'),
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
    editable: true,
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
      validation: 'required',
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
    format: (val, row) => val ? t('yes') : t('no'),
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
    },
  },
}))

const { data: machines, refresh } = useLazyFetch('/api/machines/machines', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<Machine>({
  machineId: -1,
})

function handleSelection(formData) {
  if (formData.length)
    selected.value = formData[0]
  else
    selected.value = {
      machineId: -1,
    }
}

async function handleFilterSlotsUpdate(updatedValue) {
  machines.value = await $fetch('/api/machines/machines', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}

async function handleAdd(formData) {
  await $fetch('/api/machines/machine', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData) {
  await $fetch('/api/machines/machine', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/machines/machine', {
    method: 'DELETE',
    body: {
      machineIds: formData.map(d => d.machineId),
    },
  })
  await refresh()
}

const showTeleskopSettings = ref(false)

const keys = useMagicKeys()

whenever(keys.shift_alt_t, () => {
  showTeleskopSettings.value = true
})
</script>

<template>
  <Menubar
    :machines="machines"
    :selected="selected"
    @refresh="refresh"
  />
  <FormTableKit
    :rows="machines" :columns="columns"
    form-class="grid grid-cols-2 gap-4 items-center"
    @add="handleAdd"
    @edit="handleEdit"
    @select="handleSelection"
    @delete="handleDelete"
  />
  <TeleskopSettingsDialog v-if="showTeleskopSettings" :show="showTeleskopSettings" form-class="" @close="showTeleskopSettings = false" />
</template>
