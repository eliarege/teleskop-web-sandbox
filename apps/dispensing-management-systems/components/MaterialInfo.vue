<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import type { Material, MaterialGroup } from '~/shared/types'

const props = defineProps({
  material: {
    type: Object as PropType<Material>,
    required: true,
  },
  groupOptions: {
    type: Object as PropType<MaterialGroup[]>,
    required: true,
  },
})
const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const material = toRef(props, 'material')
const editedMaterial = ref({ ...material.value })

const unitOptions = ref([
  '---',
  'TL',
  '$',
])

async function onSave() {
  try {
    await $fetch(`/api/materials/${material.value.materialCode}`, { method: 'PUT', body: editedMaterial.value })
    onDialogOK(true)
  } catch (e) {
    onDialogOK(false)
  }
}

function onCancel() {
  onDialogCancel()
}

function onReset() {
  editedMaterial.value = { ...material.value }
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
                disable
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
              color="negative"
              icon="cancel"
              @click="onCancel"
            />
            <QBtn
              :label="t('Reset')"
              icon="refresh"
              @click="onReset"
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
