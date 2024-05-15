<script setup lang="ts">
const { t } = useI18n()

const columns = computed(() => ({
  waterTypeId: {
    label: t('waterTypeId'),
    field: 'waterTypeId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    unique: true,
    type: 'number',
    visible: true,
    editable: true,
  },
  waterTypeName: {
    label: t('waterTypeName'),
    field: 'waterTypeName',
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

}))

const { data: waterTypes, refresh } = useLazyFetch('/api/water-types/water-types', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleAdd(formData) {
  await $fetch('/api/water-types/water-type', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData) {
  await $fetch('/api/water-types/water-type', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/water-types/water-types', {
    method: 'DELETE',
    body: formData.map(d => d.waterTypeId),
  })
  await refresh()
}

async function handleFilterSlotsUpdate(updatedValue) {
  waterTypes.value = await $fetch('/api/water-types/water-types', {
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
      <FormTableKit
        :rows="waterTypes"
        :columns="columns"
        form-class="grid grid-cols-1 grid-rows-1 h-40 w-80"
        @add="handleAdd"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </q-card-section>
  </q-card>
</template>
