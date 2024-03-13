<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
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
const material = toRef(props, 'material')
const dispensers = toRef(props, 'dispensers')
const selectedDispensersInitial = material.value ? ref(material.value.connectedDispensers.map(dispenser => dispenser.dispenserId)) : ref([])
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
  connectedDispensers: [],
}

const editedMaterial = ref(material.value ? { ...material.value } : { ...defaultMaterial })
if (!Array.isArray(editedMaterial.value.connectedDispensers)) {
  editedMaterial.value.connectedDispensers = []
}
const unitOptions = ref([
  '---',
  'TL',
  '$',
])
async function onSave() {
  try {
    const added = selectedDispensers.value
      .filter(dispenser =>
        !selectedDispensersInitial.value.includes(dispenser))

    const deleted = selectedDispensersInitial.value
      .filter(initialDispenser =>
        !selectedDispensers.value.includes(initialDispenser))
    if (material.value)
      await $fetch(`/api/materials/${editedMaterial.value.materialCode}`, { method: 'PUT', body: editedMaterial.value })
    else
      await $fetch(`/api/materials`, { method: 'POST', body: editedMaterial.value })
    await $fetch(`/api/connections/materials?materialCode=${editedMaterial.value.materialCode}`, { method: 'POST', body: {
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
  editedMaterial.value = material.value ? { ...material.value } : { ...defaultMaterial }
  selectedDispensers.value = [...selectedDispensersInitial.value]
}
async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('DeleteMaterial'),
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
      await $fetch(`/api/materials`, { method: 'DELETE', body: { materialCode: editedMaterial.value.materialCode } })
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
    @hide="onDialogHide"
  >
    <QCard>
      <QForm @submit.prevent>
        <div class="flex flex-col h-max">
          <div class="text-center pt-5 text-xl shadow">
            <h2>{{ t('Material') }}</h2>
          </div>
          <div class="content-section flex flex-row flex-wrap justify-center">
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
                :rules="[(val: string) => val && val.length > 0]"
                :disable="material !== undefined"
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
                v-model="editedMaterial.ph"
                class="item-input"
                dense
                type="number"
                filled
                :rules="[(val: number) => val > 0 && val < 14]"
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
                v-model="editedMaterial.density"
                class="item-input"
                dense
                type="number"
                filled
                :placeholder="editedMaterial.density"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('materialFields.UnitCost') }}
              </span>
              <QInput
                v-model="editedMaterial.unitCost"
                class="item-input"
                dense
                type="number"
                filled
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
        </div>
        <div :class="q.dark.isActive ? 'button-section-dark' : 'button-section-light'">
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
.content-section {
  flex-grow: 1;
  overflow-y: auto;
  max-height: calc(80vh - 150px);
}

.button-section-light {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-content: space-evenly;
  padding: 0.5rem;
  position: sticky;
  bottom: 0;
  z-index: 1;
  background-color: white;
  box-shadow: 0px -2px 5px rgba(0, 0, 0, 0.2);

}

.button-section-dark {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-content: space-evenly;
  padding: 0.5rem;
  position: sticky;
  bottom: 0;
  z-index: 1;
  background-color: var(--q-dark);
  box-shadow: 0px -1px 5px rgba(128, 128, 128, 0.2);
}
</style>
