<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import RecipeEditDialog from '../recipe/RecipeEditDialog.vue'
import type { RecipeMaster } from '~/shared/types'

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
  },
]

async function onEditClick(row: RecipeMaster) {
  q.dialog({
    component: RecipeEditDialog,
    componentProps: {
      recipeId: row.recipeId,
      isNew: false,
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
  q.dialog({
    component: RecipeEditDialog,
    componentProps: {
      recipeId: recipes.value ? Math.max(...recipes.value.map(obj => obj.recipeId)) + 1 : 1,
      isNew: true,
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
async function onCommandsClick(row: RecipeMaster) {

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
    table-class="max-h-150"
    :pagination
    :columns
    :rows="recipes"
    row-key="name"
  >
    <template #header="props">
      <QTr :props class="table-header">
        <QTh
          v-for="col in props.cols"
          :key="col.name"
          :props
        >
          {{ col.label }}
        </QTh>
        <QTh auto-width />
        <QTh auto-width />
      </QTr>
    </template>
    <template #body="props">
      <QTr
        :props
      >
        <QTd
          v-for="col in props.cols"
          :key="col.name"
          :props
        >
          {{ props.row[col.field] }}
        </QTd>
        <QTd auto-width>
          <QBtn
            class="cursor-pointer"
            icon="edit"
            flat
            @click="onEditClick(props.row)"
          />
        </QTd>
        <QTd auto-width>
          <QBtn
            class="cursor-pointer"
            icon="description"
            flat
            @click="onCommandsClick(props.row)"
          />
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style scoped lang="postcss">
</style>
