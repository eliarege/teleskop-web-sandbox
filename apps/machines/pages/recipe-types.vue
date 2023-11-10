<script setup lang="ts">
import { getRecipeTypes } from '~/utils'

const columns = [
  {
    name: 'typeName',
    label: 'Reçete Tip Adı',
    field: row => row.typeName,
    align: 'left',
  },
]

const { data: recipeTypes, pending, refresh } = useLazyFetch('/api/recipe-types/recipe-types', { default: () => [] })
const typeName = ref('')
const selectedRecipe = ref([])

async function handleAddRecipe() {
  await addRecipeType(typeName.value)
  await refresh()
}

async function handleEditRecipe() {
  await editRecipeType(selectedRecipe.value[0].id, typeName.value)
  await refresh()
}

async function handleDeleteRecipe() {
  await deleteRecipeType(selectedRecipe.value)
  await refresh()
  selectedRecipe.value = []
}
</script>

<template>
  <q-card class="flex flex-row">
    <q-card-section>
      <q-input v-model="typeName" label="Reçete Tipi Adı" />
      <div class="flex flex-row input-field my-8">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleAddRecipe()"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleEditRecipe()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleDeleteRecipe()"
        />
      </div>
    </q-card-section>
  </q-card>
  <div class="table-scroll">
    <q-table
      v-model:selected="selectedRecipe"
      selection="single"
      :rows="recipeTypes"
      :columns="columns"
      :loading="pending"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      row-key="typeName"
      bordered
      separator="cell"
      table-header-class="table-header"
    />
  </div>
</template>

<style scoped>
:deep(.table-header > th) {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}

.input-field > * {
  margin-right: 2em;
}
</style>
