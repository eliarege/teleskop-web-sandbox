<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import type { Machine } from '~/shared/types'

const props = defineProps({
  machine: {
    type: Object as PropType<Machine>,
    required: true,
  },
})
const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const machine = toRef(props, 'machine')
const newMachine = ref({ ...machine.value })
const machineControllerTypes = ref([])

getTypes()

async function getTypes() {
  machineControllerTypes.value = await $fetch('/api/machines/types')
}
async function onSave() {
  await $fetch(`/api/machines`, { method: 'POST', body: newMachine.value })
  onDialogOK(newMachine.value)
}

function onCancel() {
  onDialogCancel()
}

function onReset() {
  newMachine.value = { ...machine.value }
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
            <h2>{{ t('AddNewMac') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.Name') }}
              </span>
              <QInput
                v-model="newMachine.machineName"
                class="item-input"
                dense
                type="text"
                filled
                :placeholder="newMachine.machineName"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('machineFields.ControllerType') }}
              </span>
              <QSelect
                v-model="newMachine.controllerType"
                borderless
                dense
                class="item-input"
                filled
                emit-value
                map-options
                options-dense
                option-value="controllerTypeId"
                option-label="controllerTypeName"
                :options="machineControllerTypes"
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
