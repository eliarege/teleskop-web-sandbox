<script setup lang="ts">
import type { Machine } from '~/types'

const props = defineProps<{
  machines: Machine[]
  selected: Machine
}>()

const emit = defineEmits(['refresh'])

const { t, locale, setLocale } = useI18n()

const showMachineParameters = ref(false)
const showMimic = ref(false)
const showGetDyeHouseDefinitions = ref(false)
const showSetDyeHouseDefinitions = ref(false)

const { data: databaseVersion } = useLazyFetch('/api/machines/database-version', {
  default: () => '',
})

async function updateVersions() {
  await $fetch('/api/sync/machine-versions')
  emit('refresh')
}

async function loadProject() {
  await $fetch('/api/sync/update-machine', {
    method: 'GET',
    query: {
      machineId: props.selected.machineId,
    },
  })
}

async function navigateToFormulas() {
  await navigateTo({
    path: `/formulas/${props.selected.machineId}`,
  })
}
</script>

<template>
  <q-card class="flex flex-row justify-between" bordered>
    <q-card-section class="flex items-center">
      <q-btn
        :label="t('loadProject')"
        no-caps
        color="primary"
        class="mr-4"
        @click="loadProject"
      />
      <q-btn
        :label="t('receiveVersionInfo')"
        no-caps
        color="primary"
        class="mr-4"
        @click="updateVersions"
      />
      <q-btn
        :label="t('machineConstants')"
        no-caps
        color="primary"
        class="mr-4"
        @click="showMachineParameters = true"
      />
      <q-btn
        label="Mimic"
        no-caps
        color="primary"
        class="mr-4"
        @click="showMimic = true"
      />
      <q-btn
        :label="t('formulas')"
        no-caps
        color="primary"
        class="mr-4"
        @click="navigateToFormulas"
      />
      <q-btn
        :label="t('getDyehouseDefinitions')"
        no-caps
        color="primary"
        class="mr-4"
        @click="showGetDyeHouseDefinitions = true"
      />
      <q-btn
        :label="t('setDyeHouseDefinitions')"
        no-caps
        color="primary"
        class="mr-4"
        @click="showSetDyeHouseDefinitions = true"
      />
    </q-card-section>

    <q-card-section class="flex flex-row items-end mr-8">
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
    </q-card-section>
  </q-card>
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
</template>
