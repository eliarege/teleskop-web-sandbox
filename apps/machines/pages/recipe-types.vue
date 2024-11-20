<script setup lang="ts">
import type { RecipeType } from '~/types'

const { t } = useI18n()

const columns = computed(() => ({
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
    label: t('recipeTypeName'),
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
}))

const { data: recipeTypes, refresh } = useAuthFetch<RecipeType[]>('/api/recipe-types/recipe-types', {
  default: () => [],
  method: 'POST',
  body: {},
})

async function handleAdd(formData: RecipeType) {
  await $fetch('/api/recipe-types/recipe-type', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData: RecipeType) {
  await $fetch('/api/recipe-types/recipe-type', {
    method: 'PUT',
    body: formData,
  })
  await refresh()
}

async function handleDelete(formData: RecipeType[]) {
  await $fetch('/api/recipe-types/recipe-types', {
    method: 'DELETE',
    body: {
      ids: formData.map(d => d.id),
    },
  })
  await refresh()
}
</script>

<template>
  <FormTableKit
    :rows="recipeTypes"
    :columns="columns"
    form-class="grid grid-cols-1 grid-rows-1 h-40 w-80"
    @add="handleAdd"
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>
