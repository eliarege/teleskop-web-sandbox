<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import type { RecipeType } from '~/types'

const columns: Column[] = [
  {
    name: 'typeName',
    label: 'Reçete Tip Adı',
    field: 'typeName',
    align: 'left',
    filterable: true,
    filterType: 'equals',
  },
]

const { data: recipeTypes, refresh } = useLazyFetch('/api/recipe-types/recipe-types', {
  default: () => [],
  method: 'POST',
  body: {},
})

const selected = ref<RecipeType>({
  id: -1,
  typeName: '',
})

async function handleAddRecipe() {
  await addRecipeType(selected.value.typeName)
  await refresh()
}

async function handleEditRecipe() {
  await editRecipeType(selected.value.id, selected.value.typeName)
  await refresh()
}

async function handleDeleteRecipe() {
  await deleteRecipeType(selected.value)
  await refresh()
  selected.value = {
    id: -1,
    typeName: '',
  }
}

async function handleSelection(obj: RecipeType) {
  if (selected.value.id === obj.id) {
    selected.value = {
      id: -1,
      typeName: '',
    }
  } else {
    selected.value = obj
  }
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
  <q-card class="flex flex-row">
    <q-card-section>
      <q-input v-model="selected.typeName" label="Reçete Tipi Adı" />
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
    <FilterableTable
      v-model:selected="selected"
      :rows="recipeTypes"
      :columns="columns"
      @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
    >
      <template #custombody="recipeTypes">
        <q-tr
          :class="{ 'selected-row': selected.id === recipeTypes.row.id }"
          @click="handleSelection(recipeTypes.row)"
        >
          <q-td
            v-for="row in recipeTypes.cols"
            :key="row"
          >
            <span>
              {{ row.value }}
            </span>
          </q-td>
        </q-tr>
      </template>
    </FilterableTable>
  </div>
</template>

<style scoped>
.selected-row {
  background-color: #cce8ff;
}
</style>
