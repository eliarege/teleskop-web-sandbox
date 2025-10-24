<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { klona } from 'klona'
import ConfirmationDialog from './ConfirmationDialog.vue'
import type { FabricType } from '~/shared/types'

const props = defineProps({
  fabric: {
    type: Object as PropType<FabricType>,
    required: true,
  },
  isNew: {
    type: Boolean,
    required: true
  }
})
const { t } = useI18n()
const q = useQuasar()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const formRef = ref()
const fabric = toRef(props, 'fabric')
const isNew = toRef(props, 'isNew')
const defaultFabric: FabricType = {
  fabricTypeId: 0,
  fabricTypeName: '',
  fabricTypeNotes: '',
}

const editedFabric = ref(fabric.value ? klona(fabric.value) : klona(defaultFabric))

const hasChanges = computed(() => {
  return (
    JSON.stringify(editedFabric.value) !== JSON.stringify(fabric.value ? fabric.value : defaultFabric)
  )
})
async function onSave() {
  const isValid = await formRef.value.validate()
  if (!isValid)
    return
  try {
    if (!isNew.value)
      await $fetch(`/api/fabric-types/${fabric.value.fabricTypeId}`, { method: 'PUT', body: { fabricType: editedFabric.value } })
    else
      await $fetch(`/api/fabric-types`, { method: 'POST', body: { fabricType: editedFabric.value } })
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
      editedFabric.value = fabric.value ? klona(fabric.value) : klona(defaultFabric)
    })
  }
}
async function onDelete() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.Delete'),
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
      await $fetch(`/api/fabric-types/${editedFabric.value.fabricTypeId}`, { method: 'DELETE' })
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
            <h2>{{ t('Fabric') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
              <span class="item-label">
                {{ t('ID') }}
              </span>
              <QInput
                v-model="editedFabric.fabricTypeId"
                class="item-input"
                dense
                type="number"
                filled
                disable
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('fabricTypeFields.Name') }}
              </span>
              <QInput
                v-model="editedFabric.fabricTypeName"
                class="item-input"
                dense
                type="text"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('fabricTypeFields.Notes') }}
              </span>
              <QInput
                v-model="editedFabric.fabricTypeNotes"
                class="item-input"
                dense
                type="textarea"
                filled
              />
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
            v-if="fabric"
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
