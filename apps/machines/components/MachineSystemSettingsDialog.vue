<script setup lang="ts">
import MachineSystemSettingsAddDialog from './MachineSystemSettingsAddDialog.vue'
import type { Machine } from '~/types'

interface MachineSetting extends Machine {
  check: boolean
}

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const $q = useQuasar()
const { notifyError } = useNotify()
const isLoading = ref(false)
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const { data: machines } = useAuthFetch('/api/machines/machines', {
  method: 'POST',
  body: {},
  transform: (machines: Machine[]) => {
    return machines.map(machine => ({
      ...machine,
      check: false,
    })) as MachineSetting[]
  },
})

const selectedSettings = ref<{ name: string, isActive: boolean }[]>([])
const selected = ref()

function handleAdd() {
  $q.dialog({
    component: MachineSystemSettingsAddDialog,
    componentProps: {},
  }).onOk((setting: { name: string, isActive: boolean }) => {
    const index = selectedSettings.value.findIndex(s => s.name === setting.name)
    if (index !== -1) {
      selectedSettings.value[index].isActive = setting.isActive
    } else {
      selectedSettings.value.push(setting)
    }
  })
}

function handleDelete() {
  selectedSettings.value = selectedSettings.value.filter(setting => setting !== selected.value)
  selected.value = null
}

async function handleSend() {
  if (!selectedSettings.value.length) {
    notifyError(t('pleaseSelectAtLeastOneSetting'))
    return
  }

  const selectedMachines = machines.value?.filter(machine => machine.check)
  if (!selectedMachines?.length) {
    notifyError(t('pleaseSelectAtLeastOneMachine'))
    return
  }

  startTaskStream('/api/sync/machine-settings', {
    fetchOptions: {
      method: 'POST',
      body: {
        settings: selectedSettings.value,
        machines: selectedMachines.map(m => m.machineId),
      },
    },
    statusTitles: {
      running: t('updateMachineSettings.titleRunning'),
      success: t('updateMachineSettings.titleSuccess'),
      failed: t('updateMachineSettings.titleFailed'),
    },
  })
}

function selectAll() {
  machines.value?.forEach(machine => machine.check = true)
}

function deselectAll() {
  machines.value?.forEach(machine => machine.check = false)
}

function invertSelection() {
  machines.value?.forEach(machine => machine.check = !machine.check)
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="machine-system-settings-card">
      <q-card-section class="text-h6 flex flex-row">
        {{ t('updateMachineSystemSettings') }}
        <q-space />
        <q-btn
          dense
          flat
          round
          icon="close"
          @click="onDialogCancel"
        />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div>
          <div class="w-full">
            <div class="text-lg">
              {{ t('settingsToUpdate') }}
            </div>
            <div class="flex gap-4 my-4">
              <q-btn
                :label="t('add')"
                no-caps
                @click="handleAdd"
              />
              <q-btn
                :label="t('delete')"
                no-caps
                :disable="!selected"
                @click="handleDelete"
              />
            </div>
            <q-list
              separator
              bordered
              class="h-[22vh] overflow-y-auto"
            >
              <q-item
                v-for="setting in selectedSettings"
                :key="setting.name"
                clickable
                dense
                :active="selected === setting"
                active-class="bg-blue-50"
                @click="selected = setting"
              >
                <q-item-section>
                  {{ t(`updateMachineSettings.setting.${setting.name}`) }}
                  <span :class="setting.isActive ? 'text-green' : 'text-red'">
                    {{ setting.isActive ? t('active') : t('passive') }}
                  </span>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
          <q-separator class="my-3" />
          <!-- Machine List -->
          <div>
            <div class="text-lg">
              {{ t('machinesToUpdate') }}
            </div>
            <div class="flex gap-4 my-4">
              <q-btn
                :label="t('selectAll')"
                no-caps
                @click="selectAll"
              />
              <q-btn
                :label="t('deselectAll')"
                no-caps
                @click="deselectAll"
              />
              <q-btn
                :label="t('invertSelection')"
                no-caps
                @click="invertSelection"
              />
            </div>
            <q-list
              bordered
              separator
              class="h-[30vh] overflow-y-auto"
            >
              <q-item
                v-for="machine in machines"
                :key="machine.machineId"
                tag="label"
                dense
              >
                <q-checkbox v-model="machine.check" :label="machine.machineCode" />
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="flex gap-2">
        <q-btn
          :label="t('cancel')"
          no-caps
          :disable="isLoading"
          @click="onDialogCancel"
        />
        <q-btn
          :label="t('send')"
          color="primary"
          no-caps
          :loading="isLoading"
          :disable="isLoading || !selectedSettings.length || !machines?.some(m => m.check)"
          @click="handleSend"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="postcss">
.machine-system-settings-card {
  max-width: min(max(60vw, 1000px), 100vw);
  min-width: min(max(60vw, 1000px), 100vw);
  user-select: none;
}
</style>
