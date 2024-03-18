<script setup lang="ts">
import { useMagicKeys, whenever } from '@vueuse/core'
import { steamUnitOptions, tbbModelOptions } from '~/server/utils/constants'
import type { Machine } from '~/types'

const { t, locale, setLocale } = useI18n()

const { data: databaseVersion } = useLazyFetch('/api/machines/database-version', {
  default: () => '',
})

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

const showMachineParameters = ref(false)
const showMimic = ref(false)
const showGetDyeHouseDefinitions = ref(false)
const showSetDyeHouseDefinitions = ref(false)

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

async function updateVersions() {
  await $fetch('/api/sync/machine-versions')
  await refresh()
}

async function loadProject() {
  await $fetch('/api/sync/update-machine', {
    method: 'GET',
    query: {
      machineId: selected.value.machineId,
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
    body: {
      machine: formData,
      machineId: selected.value.machineId,
    },
  })
  await refresh()
}

async function handleDelete(formData) {
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

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: selected.value.machineId === -1,
    onClick: (data) => {
      copy.value = selected.value.machineId
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: selected.value.machineId === -1,
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

let lastcategory = contextMenuOptions.value[0].category
function addSeparator(key) {
  if (key !== lastcategory) {
    lastcategory = key
    return true
  } else return false
}
function handleClick(event, option) {
  if (option.disabled)
    event.preventDefault()
  else {
    option.onClick(selected.value)
  }
}
</script>

<template>
  <q-menu
    touch-position
    context-menu
  >
    <q-list>
      <template
        v-for="option in contextMenuOptions"
        :key="option.category"
      >
        <q-separator v-if="addSeparator(option.category)" />
        <q-item
          v-close-popup="!option.disabled"
          clickable
          dense
          :class="option.disabled ? 'text-gray cursor-not-allowed' : ''"
          @click="event => handleClick(event, option)"
        >
          <q-item-section class="flex w-8 justify-center items-center">
            <q-icon :name="option.icon" />
          </q-item-section>
          <q-item-section>
            {{ option.label }}
          </q-item-section>
          <q-space />
          <q-item-section class="mr-5">
            {{ option.keybind }}
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-menu>
  <div class="absolute left-63 top-13.2">
    <q-btn
      :label="t('loadProject')"
      no-caps
      push
      :disable="selected.machineId === -1"
      color="primary"
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
    :rows="machines" :columns="columns"
    form-class="grid grid-cols-4 gap-4 items-center"
    @add="handleAdd"
    @edit="handleEdit"
    @select="handleSelection"
    @delete="handleDelete"
  />

  <TeleskopSettingsDialog v-if="showTeleskopSettings" :show="showTeleskopSettings" form-class="" @close="showTeleskopSettings = false" />
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
</template>

<!--
    form-class="grid grid-cols-4 gap-4 items-center"
-->
