<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import type { Dispenser, Machine, MachineControllerType } from '~/shared/types'

const props = defineProps({
  machine: {
    type: Object as PropType<Machine>,
    required: false,
  },
  controllerTypes: {
    type: Object as PropType<MachineControllerType[]>,
    required: true,
  },
  dispensers: {
    type: Object as PropType<Dispenser[]>,
    required: true,
  },
})

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const machine = toRef(props, 'machine')
const controllerTypes = toRef(props, 'controllerTypes')
const editedMachine = ref({ ...machine.value })
const dispensers = toRef(props, 'dispensers')
const selectedDispensersInitial = machine.value ? ref(machine.value.connectedDispensers.map(dispenser => dispenser.dispenserId)) : ref([])
const selectedDispensers = ref([...selectedDispensersInitial.value])
async function onSave() {
  try {
    const added = selectedDispensers.value
      .filter(dispenser =>
        !selectedDispensersInitial.value.includes(dispenser))

    const deleted = selectedDispensersInitial.value
      .filter(initialDispenser =>
        !selectedDispensers.value.includes(initialDispenser))
    console.log(deleted)
    if (machine.value)
      await $fetch(`/api/machines/${machine.value.machineId}`, { method: 'PUT', body: editedMachine.value })
    else
      await $fetch(`/api/machines`, { method: 'POST', body: editedMachine.value })
    await $fetch(`/api/connections/machines?machineId=${editedMachine.value.machineId}`, { method: 'POST', body: {
      added,
      deleted,
    } })
    onDialogOK(true)
  } catch (e) {
    onDialogOK(false)
  }
}

function onCancel() {
  onDialogCancel()
}

function onReset() {
  editedMachine.value = { ...machine.value }
  selectedDispensers.value = [...selectedDispensersInitial.value]
}

async function onDelete() {
  try {
    await $fetch(`/api/machines`, { method: 'DELETE', body: machine.value!.machineId })
    onDialogOK(true)
  } catch (e) {
    onDialogOK(false)
  }
}
function onCheck(dispenserId: number, isChecked: boolean) {
  if (isChecked) {
    selectedDispensers.value.push(dispenserId)
  } else {
    const index = selectedDispensers.value.indexOf(dispenserId)
    if (index !== -1) {
      selectedDispensers.value.splice(index, 1)
    }
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
                :disable="machine !== undefined"
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
                :options="controllerTypes"
              />
            </div>
            <div class="row-item">
              <span class="item-label">{{ t('materialFields.ConnectedDispensers') }}</span>
              <div v-for="dispenser in dispensers" :key="dispenser.dispenserId">
                <QCheckbox
                  :value="dispenser.dispenserId"
                  :label="dispenser.dispenserName"
                  :model-value="selectedDispensers.includes(dispenser.dispenserId)"
                  @update:model-value="value => onCheck(dispenser.dispenserId, value)"
                />
              </div>
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
              v-if="machine"
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
