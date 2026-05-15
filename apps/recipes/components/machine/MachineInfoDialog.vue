<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { klona } from 'klona'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { Dispenser, Machine, MachineControllerType, MachineGroup } from '~/shared/types'

const props = defineProps({
  machine: {
    type: Object as PropType<Machine>,
    required: false,
  },
  controllerTypes: {
    type: Object as PropType<MachineControllerType[]>,
    required: true,
  },
  machineGroups: {
    type: Object as PropType<MachineGroup[]>,
    required: true,
  },
  machines: {
    type: Object as PropType<Machine[]>,
    required: true,
  },
  dispensers: {
    type: Object as PropType<Dispenser[]>,
    required: true,
  },
})

const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
defineEmits([...useDialogPluginComponent.emits])
const formRef = ref()
const machine = toRef(props, 'machine')
const machines = toRef(props, 'machines')
const defaultMachine: Machine = {
  // Set the default machineId to highest one + 1, 1 if there isn't any
  machineId: machines.value && machines.value.length > 0 ? machines.value.at(machines.value.length - 1)!.machineId + 1 : 1,
  machineName: '',
  machineGroup: 1,
  capacity: -1,
  controllerType: 1,
  connectedDispensers: null,
}
const selectedMachines = ref([])
const controllerTypes = toRef(props, 'controllerTypes')
const editedMachine = machine.value ? ref(klona(machine.value)) : ref(klona(defaultMachine))
const dispensers = toRef(props, 'dispensers')
const selectedDispensersInitial = machine.value ? ref(machine.value.connectedDispensers!.map(dispenser => dispenser.dispenserId)) : ref([])
const selectedDispensers = ref(klona(selectedDispensersInitial.value))
const hasChanges = computed(() => {
  return (
    JSON.stringify(editedMachine.value) !== JSON.stringify(machine.value? machine.value : defaultMachine)
    || JSON.stringify(selectedDispensers.value) !== JSON.stringify(selectedDispensersInitial.value)
  )
})
async function onSave() {
  const isValid = await formRef.value.validate()
  if (!isValid)
    return
  try {
    const added = selectedDispensers.value
      .filter(dispenser =>
        !selectedDispensersInitial.value.includes(dispenser))

    const deleted = selectedDispensersInitial.value
      .filter(initialDispenser =>
        !selectedDispensers.value.includes(initialDispenser))
    if (machine.value) {
      await $fetch(`/api/machines/${machine.value.machineId}`, { method: 'PUT', body: editedMachine.value })
    } else {
      await $fetch(`/api/machines`, { method: 'POST', body: editedMachine.value })
    }
    await $fetch(`/api/connections/machines`, { method: 'POST', body: {
      added,
      deleted,
    }, query: { machineId: editedMachine.value.machineId } })
    if (selectedMachines.value.length > 0) {
      await $fetch('/api/connections/machines/export/machine', { method: 'POST', query: { from: machine.value?.machineId }, body: { to: selectedMachines.value } })
    }
    onDialogOK(true)
  } catch (e) {
    onDialogOK(false)
  }
}

function onCancel() {
  if (hasChanges.value) {
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.Cancel'),
        confirmBtn: {
          label: t('Confirm'),
          color: 'positive',
          icon: 'done',
        },
        cancelBtn: {
          label: t('Cancel'),
          icon: 'close',
        },
      },
    }).onOk(() => {
      onDialogCancel()
    })
  } else {
    onDialogCancel()
  }
}

function onReset() {
  if (hasChanges.value) {
    q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        bodyText: t('confirmationDialogBody.Reset'),
        confirmBtn: {
          label: t('Reset'),
          color: 'positive',
          icon: 'done',
        },
        cancelBtn: {
          label: t('Cancel'),
          icon: 'close',
        },
      },
    }).onOk(() => {
      editedMachine.value = machine.value ? klona(machine.value) : klona(defaultMachine)
      selectedDispensers.value = klona(selectedDispensersInitial.value)
    })
  }
}

async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.DeleteMachine'),
      confirmBtn: {
        label: t('Delete'),
        color: 'negative',
        icon: 'delete',
      },
      cancelBtn: {
        label: t('Cancel'),
        icon: 'close',
      },
    },
  }).onOk(async () => {
    try {
      await $fetch(`/api/machines/${machine.value!.machineId}`, { method: 'DELETE' })
      onDialogOK(true)
    } catch (e) {
      onDialogOK(false)
    }
  })
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
    :persistent="hasChanges"
    @hide="onDialogHide"
  >
    <QCard class="scroll border-b-solid border-10px border-grey">
      <QForm ref="formRef" @submit.prevent>
        <div class="flex flex-col pb-10">
          <div class="text-center pt-5 text-xl">
            <h2>{{ t('Machine') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.ID') }}
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
                {{ t('machineFields.Capacity') }}
              </span>
              <QInput
                v-model.number="editedMachine.capacity"
                class="item-input"
                dense
                type="number"
                filled
                :placeholder="editedMachine.capacity"
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
              <span class="item-label">
                {{ t('machineFields.Group') }}
              </span>
              <QSelect
                v-model="editedMachine.machineGroup"
                borderless
                dense
                class="item-input"
                filled
                emit-value
                map-options
                options-dense
                option-value="groupId"
                option-label="groupName"
                :options="machineGroups"
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
            <div v-if="machine" class="row-item">
              <span class="item-label">{{ t('CopyConnections') }} </span>
              <QSelect
                v-model="selectedMachines"
                multiple
                dense
                filled
                emit-value
                map-options
                options-dense
                option-value="machineId"
                option-label="machineName"
                :options="machines.filter(m => m.machineId !== machine?.machineId)"
              />
            </div>
          </div>
          <div class="flex justify-center items-center gap-4 mt-6">
            <QBtn
              :label="t('Save')"
              color="primary"
              icon="save"
              type="submit"
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
