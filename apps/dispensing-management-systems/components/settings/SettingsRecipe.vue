<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import RecipeEditDialog from '../RecipeEditDialog.vue';
import type { RecipeMaster } from '~/shared/types';

const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const q = useQuasar()
const { data: recipes, refresh: refreshRecipes } = await useFetch<RecipeMaster[]>('/api/recipes/master')
  const columns: (QTableColumn<RecipeMaster>)[] = [
  {
    name: 'recipeId',
    label: t('recipeFields.ID'),
    field: 'recipeId',
    sortable: true,
    align: 'left',
  },
  {
    name: 'recipeName',
    label: t('recipeFields.Name'),
    field: 'recipeName',
    sortable: true,
    align: 'left',
  }
]

async function onRowClick(_event: Event, row: RecipeMaster) {
  q.dialog({
    component: RecipeEditDialog,
    componentProps: {
      recipeNo: row.recipeId,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshRecipes()
    } else
      notifyFail(t('Failed'))
  },
  )
}
async function addNewRecipe() {

}
const pagination = ref({ rowsPerPage: 20 })
</script>

<template>
  <div class="flex-center text-xl">
    {{ t('settings.Recipe') }}
  </div>
  <QSeparator
    class="w-full mt-5 mb-5"
  />
  <div class="flex-center mb-4">
    <QBtn
      :label="$t('AddNewRecipe')"
      no-caps
      icon="note_add"
      color="primary"
      class="h-12"
      style="white-space: nowrap; text-overflow: ellipsis;"
      clickable
      @click="addNewRecipe"
    />
  </div>
  <QTable
    flat
    bordered
    table-header-class="table-header"
    table-class="max-h-150"
    separator="cell"
    :pagination
    :columns="columns"
    :rows="recipes"
    row-key="name"
    @row-click="onRowClick"
  />
</template>

<style scoped lang="postcss">
</style>
