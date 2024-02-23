<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import type { Machine, MachineControllerType } from '~/shared/types'

const props = defineProps({
  machine: {
    type: Object as PropType<Machine>,
    required: true,
  },
  controllerTypes: {
    type: Object as PropType<MachineControllerType[]>,
    required: true,
  },
})
const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const machine = toRef(props, 'machine')
const editedMachine = ref({ ...machine.value })

async function onSave() {
  await $fetch(`/api/machines/${machine.value.machineId}`, { method: 'PUT', body: editedMachine.value })
  onDialogOK(true)
}

function onCancel() {
  onDialogCancel()
}

function onReset() {
  editedMachine.value = { ...machine.value }
}

async function onDelete() {
  try {
    await $fetch(`/api/machines`, { method: 'DELETE', body: machine.value.machineId })
    onDialogOK(true)
  } catch (e) {
    onDialogOK(false)
  }
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <QForm @submit.prevent>
        <div class="flex flex-col pb-10">
          <div class="text-center pt-5 text-xl">
            <h2>{{ t('Machine') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.No') }}
              </span>
              <QInput
                v-model="editedMachine.machineId"
                class="item-input"
                dense
                type="text"
                filled
                disable
                :placeholder="editedMachine.machineId"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.Name') }}
              </span>
              <QInput
                v-model="editedMachine.machineName"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="editedMachine.machineName"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.ControllerType') }}
              </span>
              <QSelect
                v-model="editedMachine.controllerType"
                borderless
                dense
                class="item-input"
                filled
                emit-value
                map-options
                options-dense
                option-value="controllerTypeId"
                option-label="controllerTypeName"
                :options="props.controllerTypes"
              />
            </div>
          </div>
          <div class="flex-center justify-evenly p-10">
            <QBtn
              :label="t('Save')"
              color="primary"
              icon="save"
              @click="onSave"
            />
            <QBtn
              :label="t('Cancel')"
              color="warning"
              icon="cancel"
              @click="onCancel"
            />
            <QBtn
              :label="t('Reset')"
              icon="refresh"
              @click="onReset"
            />
            <QBtn
              :label="t('Delete')"
              color="negative"
              icon="delete"
              @click="onDelete"
            />
          </div>
        </div>
      </QForm>
    </QCard>
  </QDialog>
</template>

<style scoped>
.row-item {
  gap: 2rem;
  margin: 1.25rem;
  width: 40rem;
}

.item-label {
  width: 6 rem;
}

.item-input {
  width: 27.5 rem;
}
</style>
