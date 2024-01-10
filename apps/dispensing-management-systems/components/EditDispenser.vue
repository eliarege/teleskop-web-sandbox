<script lang="ts" setup>
import type { Dispenser } from '~/shared/types';
//import { useDialogPluginComponent } from 'quasar'

const { t } = useI18n()
//const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const props = defineProps({
  dispenser: {
    type: Object as PropType<Dispenser>,
    required: true,
  }
})

const dispenser = props.dispenser
const editedDispenser = ref({...dispenser})
async function onSave() {
  await $fetch(`/api/dispensers/${dispenser.dispenserId}`, { method: 'PUT', body: editedDispenser.value })
  //onDialogOK()
}

function onCancel() {
  //onDialogCancel()
}

function onReset() {
  editedDispenser.value = {...dispenser}
}
</script>

<template>
  <QDialog full-width>
    <QCard>
      <QForm @submit.prevent>
        <div class="flex flex-col pb-10">
          <div class="text-center pt-5 text-xl">
            <h2>{{ t('Edit') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.ID') }}
                </span>
                <QInput
                  v-model="editedDispenser.dispenserId"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  disable
                  :placeholder="editedDispenser.dispenserId"
                />
              </div>
              <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.Name') }}
                </span>
                <QInput
                  v-model="editedDispenser.dispenserName"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  :placeholder="editedDispenser.dispenserName"
                />
              </div>
              <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.ConsumptionFile') }}
                </span>
                <QInput
                  v-model="editedDispenser.consumptionFilename"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  :placeholder="editedDispenser.consumptionFilename"
                />
              </div>
              <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.Protocol') }}
                </span>
                <QInput
                  v-model="editedDispenser.protocol"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  :placeholder="editedDispenser.protocol"
                />
              </div>
              <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.Type') }}
                </span>
                <QInput
                  v-model="editedDispenser.dispenserType"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  :placeholder="editedDispenser.dispenserType"
                />
              </div>
              <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.IP') }}
                </span>
                <QInput
                  v-model="editedDispenser.dispenserIP"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  :placeholder="editedDispenser.dispenserIP"
                />
              </div>
              <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.FileName') }}
                </span>
                <QInput
                  v-model="editedDispenser.fileName"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  :placeholder="editedDispenser.fileName"
                />
              </div>
              <div class="row-item">
                <span class="item-label">
                  {{ t('dispenserFields.FilePath') }}
                </span>
                <QInput
                  v-model="editedDispenser.filePath"
                  class="item-input"
                  dense
                  type="text"
                  filled
                  :placeholder="editedDispenser.filePath"
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
  display: flex;
  align-items: center;
  justify-content: space-between;
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

