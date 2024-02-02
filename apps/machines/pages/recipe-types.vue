<script setup lang="ts">
const columns = {
  id: {
    label: 'ID',
    field: 'id',
    align: 'left',
    type: 'number',
    unique: true,
    visible: false,
    editable: false,
  },
  typeName: {
    label: 'Reçete Tip Adı',
    field: 'typeName',
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
}

const { data: recipeTypes, refresh } = useLazyFetch('/api/recipe-types/recipe-types', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleAdd(formData) {
  await $fetch('/api/recipe-types/recipe-type', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData) {
  await $fetch('/api/recipe-types/recipe-type', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleDelete(formData) {
  await $fetch('/api/recipe-types/recipe-types', {
    method: 'DELETE',
    body: {
      ids: formData.map(d => d.id),
    },
  })
  await refresh()
}

async function handleFilterSlotsUpdate(updatedValue) {
  recipeTypes.value = await $fetch('/api/recipe-types/recipe-types', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <FormTableKit
    :rows="recipeTypes" :columns="columns"
    @add="handleAdd" @edit="handleEdit" @delete="handleDelete"
  />
</template>
