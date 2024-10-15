<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import RecipeProgramsDialog from '../recipe/RecipeProgramsDialog.vue'
import type { RecipeProgramMaster } from '~/shared/types'

const { t } = useI18n()
const { notifySuccess, notifyFail } = useNotify()
const q = useQuasar()
const { data: recipes, refresh: refreshPrograms } = await useFetch<RecipeProgramMaster[]>('/api/recipes/master/programs')
const columns: (QTableColumn<RecipeProgramMaster>)[] = [
  {
    name: 'recipeId',
    label: t('programFields.ID'),
    field: 'recipeId',
    sortable: true,
    align: 'left',
  },
  {
    name: 'recipeName',
    label: t('programFields.Name'),
    field: 'recipeName',
    sortable: true,
    align: 'left',
  },
]

async function onEditClick(row: RecipeProgramMaster) {
  q.dialog({
    component: RecipeProgramsDialog,
    componentProps: {
      recipeId: row.recipeId,
      isNew: false,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshPrograms()
    } else
      notifyFail(t('Failed'))
  },
  )
}

async function addNewProgram() {
  q.dialog({
    component: RecipeProgramsDialog,
    componentProps: {
      recipeId: recipes.value ? Math.max(...recipes.value.map(obj => obj.recipeId)) + 1 : 1,
      isNew: true,
    },
  }).onOk((payload: any) => {
    if (payload) {
      notifySuccess(t('Success'))
      refreshPrograms()
    } else
      notifyFail(t('Failed'))
  },
  )
}

const pagination = ref({ rowsPerPage: 20 })
</script>

<template>
  <div class="flex-center text-xl">
    {{ t('settings.Program') }}
  </div>
  <QSeparator
    class="w-full mt-5 mb-5"
  />
  <div class="flex-center mb-4">
    <QBtn
      :label="$t('AddNewProgram')"
      no-caps
      icon="note_add"
      color="primary"
      class="h-12"
      style="white-space: nowrap; text-overflow: ellipsis;"
      clickable
      @click="addNewProgram"
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
          >
            <QTooltip
              :offset="[0, 30]"
              anchor="top middle"
            >
              {{ t('Edit') }}
            </QTooltip>
          </QBtn>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>
