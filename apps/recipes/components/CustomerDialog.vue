<script lang="ts" setup>
import { useDialogPluginComponent } from 'quasar'
import { klona } from 'klona'
import ConfirmationDialog from './ConfirmationDialog.vue'
import type { Customer } from '~/shared/types'

const props = defineProps({
  customer: {
    type: Object as PropType<Customer>,
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
const customer = toRef(props, 'customer')
const isNew = toRef(props, 'isNew')
const defaultCustomer: Customer = {
  customerId: 0,
  customerNo: 0,
  customerName: '',
  customerNotes: ''
}

const editedCustomer = ref(customer.value ? klona(customer.value) : klona(defaultCustomer))

const hasChanges = computed(() => {
  return (
    JSON.stringify(editedCustomer.value) !== JSON.stringify(customer.value ? customer.value : defaultCustomer)
  )
})
async function onSave() {
  const isValid = await formRef.value.validate()
  if (!isValid)
    return
  try {
    if (!isNew.value)
      await $fetch(`/api/customers/${customer.value.customerId}`, { method: 'PUT', body: { customer: editedCustomer.value } })
    else
      await $fetch(`/api/customers`, { method: 'POST', body: { customer: editedCustomer.value } })
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
      editedCustomer.value = customer.value ? klona(customer.value) : klona(defaultCustomer)
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
      await $fetch(`/api/customers/${editedCustomer.value.customerId}`, { method: 'DELETE'})
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
            <h2>{{ t('Customer') }}</h2>
          </div>
          <div class="flex flex-row flex-wrap justify-center">
            <div class="row-item">
              <span class="item-label">
                {{ t('ID') }}
              </span>
              <QInput
                v-model="editedCustomer.customerId"
                class="item-input"
                dense
                type="number"
                filled
                disable
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('customerFields.Name') }}
              </span>
              <QInput
                v-model="editedCustomer.customerName"
                class="item-input"
                dense
                type="text"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('customerFields.No') }}
              </span>
              <QInput
                v-model="editedCustomer.customerNo"
                class="item-input"
                dense
                type="number"
                filled
              />
            </div>
            <div class="row-item">
              <span class="item-label">
                {{ t('customerFields.Notes') }}
              </span>
              <QInput
                v-model="editedCustomer.customerNotes"
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
            v-if="customer"
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
