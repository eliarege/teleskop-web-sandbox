<script setup lang="ts">
import type { StopReason } from '~/types'

const kc = useKeycloak()
const { t } = useI18n()
const { notifySuccess, notifyError } = useNotify()

function getErrorMessage(error: any): string {
  if (error?.data?.errorKey) {
    const errorKey = error.data.errorKey

    if (errorKey.includes('.')) {
      const translation = t(`errorMessages.${errorKey}`)
      if (translation !== `errorMessages.${errorKey}`) {
        return translation
      }
    } else {
      const translation = t(`errorMessages.${errorKey}`)
      if (translation !== `errorMessages.${errorKey}`) {
        return translation
      }
    }
  }

  if (error?.data?.message) {
    const message = error.data.message.toLowerCase()

    if (message.includes('duplicate') || message.includes('unique')) {
      return t('errorMessages.database.duplicateKey')
    }

    if (message.includes('connection') || message.includes('network')) {
      return t('errorMessages.connectionError')
    }

    if (message.includes('timeout')) {
      return t('errorMessages.timeoutError')
    }
  }

  if (error?.status) {
    switch (error.status) {
      case 400:
        return t('errorMessages.badRequest')
      case 401:
        return t('errorMessages.unauthorized')
      case 403:
        return t('errorMessages.forbidden')
      case 404:
        return t('errorMessages.notFound')
      case 409:
        return t('errorMessages.conflict')
      case 500:
        return t('errorMessages.serverError')
      case 503:
        return t('errorMessages.serviceUnavailable')
    }
  }

  return t('errorMessages.general')
}

const columns = computed(() => ({
  stopCode: {
    label: `${t('idle')} ID`,
    field: 'stopCode',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'number',
    visible: true,
    editable: true,
    unique: true,
    schema: {
      filled: true,
      validation: 'required|min:1',
    },
  },
  stopName: {
    label: t('idleCause'),
    field: 'stopName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  reportToERP: {
    label: t('erpFailureNotification'),
    field: 'reportToERP',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: true,
    editable: true,
    format: (val: boolean) => val ? t('yes') : t('no'),
    schema: {
      filled: true,
    },
  },

}))

const { data: stopReasons, refresh } = useAuthFetch<StopReason[]>('/api/stop-reasons/stop-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleEdit(formData: StopReason, originalData: StopReason) {
  try {
    const body = {
      ...formData,
      originalStopCode: originalData.stopCode,
    }

    await kc.fetch('/api/stop-reasons/stop-reason', {
      method: 'PUT',
      body,
    })
    await refresh()
    notifySuccess(t('stopReasonUpdatedSuccessfully'))
  } catch (error) {
    console.error('Edit error:', error)
    notifyError(getErrorMessage(error))
  }
}

async function handleAdd(formData: StopReason) {
  try {
    let stopCode: number

    if (formData.stopCode !== undefined && formData.stopCode !== null) {
      stopCode = formData.stopCode
    } else {
      if (stopReasons.value.length === 0) {
        stopCode = 1
      } else {
        const maxId = Math.max(...stopReasons.value.map(reason => reason.stopCode))
        stopCode = maxId + 1
      }
    }

    await kc.fetch('/api/stop-reasons/stop-reason', {
      method: 'POST',
      body: {
        stopCode,
        stopName: formData.stopName,
        reportToERP: formData.reportToERP,
      },
    })
    await refresh()
    notifySuccess(t('stopReasonAddedSuccessfully'))
  } catch (error) {
    console.error('Add error:', error)
    notifyError(getErrorMessage(error))
  }
}

async function handleDelete(formData: StopReason[]) {
  try {
    await kc.fetch('/api/stop-reasons/stop-reasons', {
      method: 'DELETE',
      body: {
        stopCodes: formData.map(d => d.stopCode),
      },
    })
    await refresh()
    notifySuccess(t('stopReasonsDeletedSuccessfully'))
  } catch (error) {
    console.error('Delete error:', error)
    notifyError(getErrorMessage(error))
  }
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row justify-between">
        <h3>
          {{ t('idleInfo') }}
        </h3>
      </div>
      <FormTableKit
        :rows="stopReasons"
        :columns="columns"
        form-class="grid grid-cols-1 grid-rows-2 h-70 w-80"
        @add="handleAdd"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
