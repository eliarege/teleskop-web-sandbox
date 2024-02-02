<script setup lang="ts">
const columns = {
  stopCode: {
    label: 'Duruş ID',
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
      validation: 'required',
    },
  },
  stopName: {
    label: 'Duruş Nedeni',
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
    label: 'ERP Arıza Bildirimi',
    field: 'reportToERP',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: true,
    editable: true,
    format: (val, row) => val ? 'Evet' : 'Hayır',
    schema: {
      filled: true,
    },
  },

}

const { data: stopReasons, refresh } = useLazyFetch('/api/stop-reasons/stop-reasons', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleEdit(formData) {
  await $fetch('/api/stop-reasons/stop-reason', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleAdd(formData) {
  await $fetch('/api/stop-reasons/stop-reason', {
    method: 'POST',
    body: {
      stopCode: stopReasons.value[stopReasons.value.length - 1].stopCode + 1,
      stopName: formData.stopName,
      reportToERP: formData.reportToERP,
    },
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/stop-reasons/stop-reasons', {
    method: 'DELETE',
    body: {
      stopCodes: formData.map(d => d.stopCode),
    },
  })
  await refresh()
}

async function handleFilterSlotsUpdate(updatedValue) {
  stopReasons.value = await $fetch('/api/stop-reasons/stop-reasons', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row justify-between">
        <h3>
          Cihaz versiyonu 3.6 veya daha eski ise ilk 20 manuele alma nedeni
          cihazda kullanılabilir.
        </h3>
      </div>
      <FormTableKit
        :rows="stopReasons" :columns="columns"
        @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
