<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { klona } from 'klona'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { Dispenser, Tank } from '~/shared/types'

const props = defineProps({
  machineId: {
    type: Number,
    required: true,
  },
  tankNo: {
    type: Number,
    required: true,
  },
  tankNos: {
    type: Array<number>,
    required: true,
  },
  isNew: {
    type: Boolean,
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
const formRef = ref()
const defaultTank = ref<Tank>({
  machineId: props.machineId,
  tankNo: props.tankNo,
  tankName: '',
  tankCap: 0,
  dispenserId: -1,
  additionalCap: 0,
  tankType: 0,
  autoWaterSystem: false,
  externalWaterSystem: false,
  levelSensorPlcNo: 0,
  levelSensorPlcId: 0,
  levelSensorInputNo: 0,
  fillWaterBeforePercentage: 0,
  mixingTime: 0,
  desTankId: 0,
})
const editedTank = ref<Tank>({
  machineId: props.machineId,
  tankNo: props.tankNo,
  tankName: '',
  tankCap: 0,
  dispenserId: -1,
  additionalCap: 0,
  tankType: 0,
  autoWaterSystem: false,
  externalWaterSystem: false,
  levelSensorPlcNo: 0,
  levelSensorPlcId: 0,
  levelSensorInputNo: 0,
  fillWaterBeforePercentage: 0,
  mixingTime: 0,
  desTankId: 0,
})
async function getTank() {
  if (!props.isNew) {
    defaultTank.value = (await $fetch(`/api/machines/tanks/${props.machineId}`)).find(object => object.tankNo === props.tankNo)
    editedTank.value = klona(defaultTank.value)
  }
}
getTank()
const hasChanges = computed(() => {
  return (
    JSON.stringify(editedTank.value) !== JSON.stringify(defaultTank.value)
  )
})
async function onSave() {
  const isValid = await formRef.value?.validate()
  if (isValid) {
    try {
      if (!props.isNew) {
        await $fetch(`/api/machines/tanks/${editedTank.value.machineId}`, { method: 'PUT', body: editedTank.value })
      } else {
        await $fetch(`/api/machines/tanks`, { method: 'POST', body: editedTank.value })
      }
      onDialogOK(true)
    } catch (e) {
      console.error(e)
      onDialogOK(false)
    }
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
      editedTank.value = klona(defaultTank.value)
    })
  }
}

async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.DeleteTank'),
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
      await $fetch(`/api/machines/tanks/${editedTank.value!.machineId}`, { method: 'DELETE', body: { tankNo: editedTank.value?.tankNo } })
      onDialogOK(true)
    } catch (e) {
      onDialogOK(false)
    }
  })
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
                v-model="editedTank.machineId"
                class="item-input"
                dense
                type="number"
                filled
                :disable="props.machineId !== null"
                :placeholder="props.machineId"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.TankNo') }}
              </span>
              <QInput
                v-model.number="editedTank.tankNo"
                class="item-input"
                dense
                type="number"
                filled
                :rules="[(val: number) => val === props.tankNo || !props.tankNos.includes(val)]"
                :min="0"
                :error-message="t('AlreadyExists')"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.TankName') }}
              </span>
              <QInput
                v-model="editedTank.tankName"
                class="item-input"
                dense
                type="text"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.TankCap') }}
              </span>
              <QInput
                v-model="editedTank.tankCap"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('Dispenser') }}
              </span>
              <QSelect
                v-model="editedTank.dispenserId"
                borderless
                dense
                filled
                style="min-width: 30vw; max-width: 40vw;"
                emit-value
                map-options
                options-dense
                option-value="dispenserId"
                option-label="dispenserName"
                :options="props.dispensers"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.AdditionalCap') }}
              </span>
              <QInput
                v-model.number="editedTank.additionalCap"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.TankType') }}
              </span>
              <QInput
                v-model.number="editedTank.tankType"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.AutoWaterSystem') }}
              </span>
              <QCheckbox
                v-model="editedTank.autoWaterSystem"
                dense
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.ExternalWaterSystem') }}
              </span>
              <QCheckbox
                v-model="editedTank.externalWaterSystem"
                dense
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.LevelSensorPlcNo') }}
              </span>
              <QInput
                v-model.number="editedTank.levelSensorPlcNo"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.LevelSensorPlcId') }}
              </span>
              <QInput
                v-model.number="editedTank.levelSensorPlcId"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.LevelSensorInputNo') }}
              </span>
              <QInput
                v-model.number="editedTank.levelSensorInputNo"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.FillWaterBeforePercentage') }}
              </span>
              <QInput
                v-model.number="editedTank.fillWaterBeforePercentage"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.MixingTime') }}
              </span>
              <QInput
                v-model.number="editedTank.mixingTime"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.DesTankId') }}
              </span>
              <QInput
                v-model.number="editedTank.desTankId"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
          </div>
          <div class="flex-center justify-evenly p-10">
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
              v-if="isNew"
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
