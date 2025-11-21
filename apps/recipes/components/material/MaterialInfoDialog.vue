<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { klona } from 'klona'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { Dispenser, Material, MaterialGroup } from '~/shared/types'

const props = defineProps({
  material: {
    type: Object as PropType<Material>,
    required: false,
  },
  groupOptions: {
    type: Object as PropType<MaterialGroup[]>,
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
const material = toRef(props, 'material')
const dispensers = toRef(props, 'dispensers')
const selectedDispensersInitial = material.value ? ref(material.value.connectedDispensers!.map(dispenser => dispenser.dispenserId)) : ref([])
const selectedDispensers = ref([...selectedDispensersInitial.value])
const defaultMaterial: Material = {
  materialCode: '',
  materialName: '',
  materialGroupNo: 1,
  density: 1,
  ph: 1,
  source: '',
  costUnit: '',
  unitCost: 0,
  reRequestable: false,
  directTransfer: false,
  isManual: false,
  connectedDispensers: [],
}

const editedMaterial = ref(material.value ? klona(material.value) : klona(defaultMaterial))
if (!Array.isArray(editedMaterial.value.connectedDispensers)) {
  editedMaterial.value.connectedDispensers = []
}
const unitOptions = ref([
  '---',
  'TL',
  '$',
])
const hasChanges = computed(() => {
  return (
    JSON.stringify(editedMaterial.value) !== JSON.stringify(material.value ? material.value : defaultMaterial)
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
    if (material.value)
      await $fetch(`/api/materials/${encodeURIComponent(material.value.materialCode)}`, { method: 'PUT', body: editedMaterial.value })
    else
      await $fetch(`/api/materials`, { method: 'POST', body: editedMaterial.value })
    await $fetch(`/api/connections/materials?materialCode=${encodeURIComponent(editedMaterial.value.materialCode)}`, { method: 'POST', body: {
      added,
      deleted,
    } })
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
      editedMaterial.value = material.value ? klona(material.value) : klona(defaultMaterial)
      selectedDispensers.value = klona(selectedDispensersInitial.value)
    })
  }
}
async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.DeleteMaterial'),
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
      await $fetch(`/api/materials/${encodeURIComponent(material.value!.materialCode)}`, { method: 'DELETE' })
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
            <h2>{{ t('Material') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.Code') }}
              </span>
              <QInput
                v-model="editedMaterial.materialCode"
                class="item-input"
                dense
                type="text"
                filled
                :rules="[
                  (val) => val && val.length > 0 || 'Field is required',
                  (val) => /^[a-zA-Z0-9]+$/.test(val) || 'Only alphanumeric characters allowed',
                ]"
                :placeholder="editedMaterial.materialCode"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.Name') }}
              </span>
              <QInput
                v-model="editedMaterial.materialName"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="editedMaterial.materialName"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.PH') }}
              </span>
              <QInput
                v-model.number="editedMaterial.ph"
                class="item-input"
                dense
                filled
                type="number"
                max="14"
                min="0"
                :rules="[(val: number) => val >= 0 && val <= 14]"
                :placeholder="editedMaterial.ph"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.Group') }}
              </span>
              <QSelect
                v-model="editedMaterial.materialGroupNo"
                borderless
                dense
                class="item-input"
                filled
                emit-value
                map-options
                options-dense
                option-value="materialGroupNo"
                option-label="materialGroupName"
                :options="groupOptions"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.CostUnit') }}
              </span>
              <QSelect
                v-model="editedMaterial.costUnit"
                borderless
                dense
                class="item-input"
                filled
                :options="unitOptions"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.Density') }}
              </span>
              <QInput
                v-model.number="editedMaterial.density"
                class="item-input"
                dense
                filled
                type="number"
                :rules="[(val: number) => val >= 0]"
                min="0"
                :placeholder="editedMaterial.density"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.UnitCost') }}
              </span>
              <QInput
                v-model.number="editedMaterial.unitCost"
                class="item-input"
                dense
                filled
                type="number"
                :rules="[(val: number) => val >= 0]"
                min="0"
                :placeholder="editedMaterial.unitCost"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.Source') }}
              </span>
              <QInput
                v-model="editedMaterial.source"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="editedMaterial.source"
              />
            </div>
            <div class="row-item pl-50">
              <span class="item-label">
                {{ t('materialFields.ReRequestable') }}
              </span>
              <QCheckbox v-model="editedMaterial.reRequestable" />
            </div>
            <div class="row-item pl-50">
              <span class="item-label">
                {{ t('materialFields.DirectTransfer') }}
              </span>
              <QCheckbox v-model="editedMaterial.directTransfer" />
            </div>
            <div class="row-item pl-50">
              <span class="item-label">
                {{ t('materialFields.IsManual') }}
              </span>
              <QCheckbox v-model="editedMaterial.isManual" />
            </div>
            <div class="row-item">
              <span class="item-label">{{ t('materialFields.ConnectedDispensers') }}</span>
              <div v-for="dispenser in dispensers" :key="dispenser.dispenserId">
                <QCheckbox
                  :value="dispenser.dispenserId"
                  :label="dispenser.dispenserName"
                  :model-value="selectedDispensers.includes(dispenser.dispenserId)"
                  :disable="editedMaterial.isManual"
                  @update:model-value="value => onCheck(dispenser.dispenserId, value)"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-button-section">
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
            v-if="material"
            :label="t('Delete')"
            color="negative"
            icon="delete"
            @click="onDelete"
          />
        </div>
      </QForm>
    </QCard>
  </QDialog>
</template>
