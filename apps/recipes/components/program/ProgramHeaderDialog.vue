<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { klona } from 'klona'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type { Machine, OptionMap, ProgramHeader } from '~/shared/types'
import { RecipeType } from '~/shared/constants'
import { useStateStore } from '~/store/State'

const props = defineProps({
  program: {
    type: Object as PropType<ProgramHeader>,
    required: false,
  },
  machines: {
    type: Object as PropType<Machine[]>,
    required: true,
  },
})
const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
defineEmits([...useDialogPluginComponent.emits])
const stateStore = useStateStore()
const formRef = ref()
const program = toRef(props, 'program')
const machines = toRef(props, 'machines')
const defaultProgram: ProgramHeader = {
  machineId: stateStore.defaultMachine,
  programNo: 0,
  programName: '',
  programType: 0,
  chemRequests: 0,
  dyeRequests: 0,
  saltRequests: 0,
}
const types: OptionMap[] = [{ id: 0, name: t('programTypes.0') }, { id: 1, name: t('programTypes.1') }, { id: 2, name: t('programTypes.2') }, { id: 3, name: t('programTypes.3') }, { id: 4, name: t('programTypes.4') }, { id: 5, name: t('programTypes.5') }, { id: 6, name: t('programTypes.6') }, { id: 7, name: t('programTypes.7') }]
const template = ref()
const editedProgram = ref(program.value ? klona(program.value) : klona(defaultProgram))
function onChange(type: RecipeType) {
  if (type === RecipeType.CHEM)
    template.value.programHeader.chemRequests = editedProgram.value.chemRequests
  else if (type === RecipeType.DYE)
    template.value.programHeader.dyeRequests = editedProgram.value.dyeRequests
  else if (type === RecipeType.SALT)
    template.value.programHeader.saltRequests = editedProgram.value.saltRequests
}
const hasChanges = computed(() => {
  return (
    JSON.stringify(editedProgram.value) !== JSON.stringify(program.value ? program.value : defaultProgram)
  )
})
function getMachineLabel(machine: Machine) {
  return `${machine.machineId} - ${machine.machineName}`
}
async function onSave() {
  const isValid = await formRef.value.validate()
  if (!isValid)
    return
  try {
    const isTemplateValid = template.value.onValidate()
    if (!isTemplateValid)
      return

    await $fetch(`/api/programs/headers`, { method: 'POST', body: { program: editedProgram.value } })

    const canSaveTemplate = await template.value.onSave()
    onDialogOK(canSaveTemplate)
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
  if (hasChanges.value || template.value.hasChanges) {
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
      template.value.onReset()
      editedProgram.value = program.value ? klona(program.value) : klona(defaultProgram)
    })
  }
}
async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.DeleteProgram'),
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
      await $fetch(`/api/programs/headers`, { method: 'DELETE', body: { program: editedProgram.value } })
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
    <QCard class="program-header-card">
      <QForm ref="formRef" class="program-header-form" @submit.prevent>
        <QCardSection class="program-header-section flex border-b-(1 solid white/20) p-4">
          <h2 class="text-2xl">{{ t('recipeFields.Program') }}</h2>
          <QSpace />
          <QBtn dense flat round icon="close" @click="onCancel" />
        </QCardSection>

        <QCardSection class="program-header-content">
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
              <span class="item-label">
                {{ t('programFields.ID') }}
              </span>
              <QInput
                v-model="editedProgram.programNo"
                class="item-input"
                dense
                type="number"
                filled
                :disable="program !== undefined"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('programFields.Type') }}
              </span>
              <QSelect
                v-model="editedProgram.programType"
                borderless
                dense
                filled
                emit-value
                map-options
                options-dense
                option-value="id"
                option-label="name"
                :options="types"
              />
            </div>
            <div v-show="false" class="row-item">
              <span class="item-label">
                {{ t('Machine') }}
              </span>
              <QSelect
                v-model="editedProgram.machineId"
                borderless
                dense
                filled
                emit-value
                map-options
                options-dense
                option-value="machineId"
                :option-label="getMachineLabel"
                :options="machines"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('programFields.Name') }}
              </span>
              <QInput
                v-model="editedProgram.programName"
                class="item-input"
                dense
                type="text"
                filled
              />
            </div>

            <div class="row-item">
              <span class="item-label">
                {{ t('programFields.ChemRequests') }}
              </span>
              <QInput
                v-model.number="editedProgram.chemRequests"
                class="item-input"
                dense
                filled
                type="number"
                :rules="[(val: number) => val >= 0]"
                min="0"
                @update:model-value="onChange(RecipeType.CHEM)"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('programFields.DyeRequests') }}
              </span>
              <QInput
                v-model.number="editedProgram.dyeRequests"
                class="item-input"
                dense
                filled
                type="number"
                :rules="[(val: number) => val >= 0]"
                min="0"
                @update:model-value="onChange(RecipeType.DYE)"
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('programFields.SaltRequests') }}
              </span>
              <QInput
                v-model.number="editedProgram.saltRequests"
                class="item-input"
                dense
                filled
                type="number"
                :rules="[(val: number) => val >= 0]"
                min="0"
                @update:model-value="onChange(RecipeType.SALT)"
              />
            </div>
          </div>
          <ProgramTemplate
            ref="template"
            :is-new="false"
            :program-header="editedProgram"
          />
        </QCardSection>

        <QCardSection class="dialog-button-section border-t-(1 solid white/20)">
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
            v-if="program"
            :label="t('Delete')"
            color="negative"
            icon="delete"
            @click="onDelete"
          />
        </QCardSection>
      </QForm>
    </QCard>
  </QDialog>
</template>

<style scoped>
.program-header-card {
  height: 100%;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.program-header-form {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.program-header-section,
.dialog-button-section {
  flex-shrink: 0;
}

.program-header-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
