<script setup lang="ts">
import { steamUnitOptions, tbbModelOptions } from '~/server/utils/constants'

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

const columns = ref({
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
    label: 'Makine Adı',
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
    label: 'Grup',
    field: 'groupNo',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: true,
    editable: true,
    format: (val, row) => machineGroups.value.find(d => d.value === val) ? machineGroups.value.find(d => d.value === val).label : val,
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
    format: (val, row) => tbbModelOptions.find(d => d === val) ? tbbModelOptions.find(d => d === val) : val,
    schema: {
      filled: true,
      validation: 'required',
      options: tbbModelOptions,
    },
  },
  version: {
    label: 'Versiyon',
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
    label: 'Makine Kapasitesi (kg)',
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
  nozzleCount: {
    label: 'Kule Sayısı',
    field: 'nozzleCount',
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
    label: 'Makine IP',
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
    label: 'PLC Modeli',
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
    label: 'Teorik Şarj Sayısı',
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
    label: 'Teorik Şarj Süresi (dk)',
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
  reelCount: {
    label: 'Düze Sayısı',
    field: 'reelCount',
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
    label: 'Buhar Birimi',
    field: 'steamUnit',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: false,
    editable: true,
    format: (val, row) => steamUnitOptions.find(d => d === val) ? steamUnitOptions.find(d => d === val) : val,
    schema: {
      filled: true,
      options: steamUnitOptions,
    },
  },

  inUse: {
    label: 'Kullanımda',
    field: 'inUse',
    align: 'left',
    type: 'checkbox',
    visible: false,
    editable: true,
    format: (val, row) => val ? 'Evet' : 'Hayır',
    schema: {
      filled: true,
    },
  },
  additionalTank1: {
    label: 'İlave Kazan 1',
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
    label: 'İlave Kazan 2',
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
    label: 'İlave Kazan 3',
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
    label: 'İlave Kazan 4',
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
    label: 'Rezerve Kazan',
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
    label: 'Elektrik Sayacı Değerini Artan Olarak Sakla',
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
    label: 'Teorik Su Miktarı Hesaplama Aktif',
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
    label: 'Ana Kazan Sıcaklık Girişi',
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
    label: 'Teorik Buhar Hesabı Aktif',
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
    label: 'Buhar Tüketimi (kg/saat)',
    field: 'plcModel',
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
    label: 'Buhar Vanası',
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
})
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
</script>

<template>
  <Menubar
    :machines="machines"
    :selected="selected"
    @delete-machine="refresh"
    @add-machine="refresh"
  />
  <FormTableKit
    :rows="machines" :columns="columns"
    form-class="grid grid-cols-2 gap-4 items-center"
    @add="handleAdd"
    @edit="handleEdit"
    @select="handleSelection"
    @delete="handleDelete"
  />
</template>
