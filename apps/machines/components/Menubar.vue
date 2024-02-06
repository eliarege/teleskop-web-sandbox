<script setup lang="ts">
import type { Machine } from '~/types'
import { deleteMachines } from '~/utils'

const props = defineProps<{
  machines: Machine[]
  selected: Machine
}>()

const emit = defineEmits(['deleteMachine', 'addMachine'])

const { t, locale, setLocale } = useI18n()

const showMachineParameters = ref(false)
const showMimic = ref(false)
const showFormulas = ref(false)
const machineId = computed(() => props.selected.machineId)

const { data: version } = useLazyFetch('/api/soap/get-version', {
  default: () => 0,
  query: {
    machineId,
  },
})

async function loadProject() {
  await $fetch('/api/ftp/update-machine', {
    method: 'GET',
    query: {
      machineId: props.selected.machineId,
      ip: props.selected.ip,
    },
  })
}

async function loadDefinitions() {
  await $fetch('/api/ftp/update-definitions', {
    method: 'GET',
    query: {
      machineId: props.selected.machineId,
      ip: props.selected.ip,
    },
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
        label="Versiyon Bilgisi Al"
        no-caps
        color="primary"
        class="mr-4"
      />
      <q-btn
        label="Makine Sabitleri"
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
        label="Formüller"
        no-caps
        color="primary"
        class="mr-4"
        @click="showFormulas = true"
      />
      <q-btn
        label="Tanımları Al"
        no-caps
        color="primary"
        class="mr-4"
        @click="loadDefinitions"
      />
    </q-card-section>

    <q-card-section class="flex flex-row items-end mr-8">
      <q-chip class="mr-4 mb-2">
        DB v{{ version }}
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
  <FormulasDialog
    v-if="showFormulas"
    :show="showFormulas"
    :selected="selected"
    @close="showFormulas = false"
  />
</template>
