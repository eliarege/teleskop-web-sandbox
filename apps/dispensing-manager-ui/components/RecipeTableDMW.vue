<script setup lang="ts">
import type { TableColumnCtx } from 'element-plus'
import type { PropType } from 'vue'
import RecipeStepPreviousRequestsContent from './RecipeStepPreviousRequestsContent.vue'
import { notification, onDrop, onKeydownPreventNonNumerical, onPastePreventNonNumerical } from '~/shared/functions'
import type { RecipeLatest } from '~/shared/types'

const props = defineProps({
  data: {
    type: Array as PropType<RecipeLatest[]>,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  groupables: {
    type: Array<{ key: keyof RecipeLatest, index: number }>,
    required: true,
  },
  show: Boolean,
  title: {
    type: String,
    required: true,
  },
  machineid: {
    type: Number,
    required: true,
  },
  resetCounter: {
    type: Number,
    default: 0,
  },
  haveContextMenu: {
    type: Boolean,
    default: true,
    required: false,
  },
})
const $q = useQuasar()
const { t } = useI18n()
interface SpanMethodProps {
  row: RecipeLatest
  column: TableColumnCtx<RecipeLatest>
  rowIndex: number
  columnIndex: number
}

function objectSpanMethod({ row, rowIndex, columnIndex }: SpanMethodProps) {
  const property = props.groupables.find(prop => prop.index === columnIndex)
  if (!property) {
    return { rowspan: 1, colspan: 1 }
  }
  const prevRow = props.data[rowIndex - 1] || {}
  const prevGroupables = props.groupables.slice(0, columnIndex + 1)
  let rowspan = 1

  const isSameAsPrevRow = prevGroupables.every(
    groupable => prevRow[groupable.key] === row[groupable.key],
  )

  if (isSameAsPrevRow) {
    return { rowspan: 0, colspan: 0 }
  }
  for (let i = rowIndex + 1; i < props.data.length; i++) {
    const nextRow = props.data[i]
    const isEqual = prevGroupables.every(
      groupable => nextRow[groupable.key] === row[groupable.key],
    )
    if (isEqual) {
      rowspan++
    } else {
      break
    }
  }
  return { rowspan, colspan: 1 }
}

const selectedRow = ref()
const rgbClasses = ['violet-class', 'blue-class', 'green-class', 'red-class', 'aqua-class', 'orange-class']
function a({ row, columnIndex }: SpanMethodProps) {
  // HARDCODED! columnIndex 4 === chemCode --> veri değişirse değiştir!
  const isDyeCell = (columnIndex === 7 || columnIndex === 8) && row.recipeType === 1 && row.processOrder
  const isAmountCell = (columnIndex === 10 || columnIndex === 11) && row.processOrder && row.recipeAmount
  if (isDyeCell || isAmountCell) {
    const color = rgbClasses[row.processOrder % rgbClasses.length]
    return color
  }
  let colorCondition = row.processOrder === selectedRow.value?.processOrder
  let className = ''
  if (colorCondition) {
    if (row === selectedRow.value) {
      return 'selected-blue'
    } else {
      props.groupables.forEach((item) => {
        colorCondition = colorCondition && row[item.key] === selectedRow.value[item.key]
        if (colorCondition && columnIndex === item.index)
          className = 'selected-blue'
      })
      return className
    }
  }

  return 'normal-class'
}

const tableContainer = ref()
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ top: '0px', left: '0px' })
function handleContextMenu(event: { preventDefault: () => void, clientY: any, clientX: any }, row: any) {
  selectedRow.value = row
  event.preventDefault()
  contextMenuVisible.value = true
  document.body.style.overflow = 'hidden'
  contextMenuPosition.value = { top: `${event.clientY}px`, left: `${event.clientX}px` }
}
function handleMenuClick() {
  contextMenuVisible.value = false
  document.body.style.overflow = 'auto'
}

document.addEventListener('click', (e) => {
  if (tableContainer.value && !tableContainer.value.contains(e.target)) {
    contextMenuVisible.value = false
  }
  document.body.style.overflow = 'auto'
})

const requestDialog = ref(false)
const confirmationDialog = ref(false)

const changeDialog = ref(false)
const changeValue = ref()
async function changeRow() {
  await $fetch('/api/recipe/change-recipe-amount', {
    method: 'PUT',
    body: {
      planKey: selectedRow.value.planKey,
      ISN: selectedRow.value.ISN,
      chemCode: selectedRow.value.chemCode,
      newAmount: changeValue.value,
    },
  })
  selectedRow.value.amount = changeValue.value
  changeValue.value = null
}
const priority = ref()
const tankNo = ref()
const isTankNoRequired = ref()
let materials: ({ materialCode: string | null, amount: number | null })[] = []

async function checkIsTankNoRequired() {
  requestDialog.value = true
  selectedRow.value.programTotalCount = 0
  props.data.forEach((row) => {
    if (selectedRow.value.ISN === row.ISN)
      materials.push({ materialCode: row.chemCode, amount: row.amount })
    if (selectedRow.value.programNo === row.programNo && row.parallelStep === 1)
      selectedRow.value.programTotalCount++
  })
  const materialCodes = materials.map(material => material.materialCode)
  isTankNoRequired.value = await $fetch('/api/recipe/check-tank-no-required', {
    method: 'POST',
    body: {
      materialCodes,
    },
  })
}
const priorityOptions = [
  { label: t('recipe.priorityLow'), value: 10 },
  { label: t('recipe.priorityNormal'), value: 50 },
  { label: t('recipe.priorityHigh'), value: 75 },
  { label: t('recipe.priorityCritical'), value: 99 },
]
async function requestRow() {
  const data = [
    2,
    priority.value.value,
    props.machineid,
    tankNo.value,
    selectedRow.value.joborder,
    selectedRow.value.programNo,
    selectedRow.value.mainStep,
    selectedRow.value.mainStep,
    selectedRow.value.programTotalCount,
    selectedRow.value.recipeType,
    selectedRow.value.processOrder,
  ]

  const response = await $fetch('/api/file/write-recipe-step', {
    method: 'POST',
    body: {
      row: selectedRow.value,
      content: data,
      materials,
    },
  })
  const errorMessage = response === 1
    ? t('warnings.requestSucceedDefault')
    : t('warnings.requestErrorDefault') + t(`warnings.requestError${response.error}`, { status: response.error === 4 ? t(`statusCodes.${response.status}`) : '' })
  notification(response === 1, errorMessage)
  tankNo.value = null
  priority.value = null
  materials = []
}

watch(() => props.resetCounter, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    selectedRow.value = null
  }
})

async function showLogsOfSelectedStep() {
  if (selectedRow.value) {
    const { joborder, programNo, mainStep } = selectedRow.value
    const data = await $fetch('/api/recipe/previous-requests', {
      method: 'POST',
      body: { joborder, programNo, mainStep },
    })
    if (!data.length)
      notification(false, t('warnings.noPreviousStepLogs'))
    else {
      $q.dialog({
        component: RecipeStepPreviousRequestsContent,
        componentProps: {
          joborder,
          programNo,
          mainStep,
          data,
        },
      })
    }
  }
}
</script>

<template>
  <div class="w-full h-full">
    <ElTable
      :span-method="objectSpanMethod"
      :data="props.data"
      :border="true"
      :stripe="true"
      table-layout="fixed"
      class-name="el-table-override"
      header-cell-class-name="whitespace-nowrap text-black"
      row-class-name="text-black"
      :cell-class-name="a"
      style=" cursor: pointer;"
      size="small"
      empty-text="There is no Recipe to show."
      :show-overflow-tooltip="true"
      @cell-click="(row, col, cell, event) => selectedRow === row ? selectedRow = null : selectedRow = row"
      @cell-contextmenu="(row, col, cell, event) => handleContextMenu(event, row)"
    >
      <ElTableColumn
        style="color: black;"
        :label="title"
        align="center"
      >
        <ElTableColumn
          v-for="col in props.columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          align="center"
          show-overflow-tooltip
        />
      </ElTableColumn>
    </ElTable>
    <div
      v-if="contextMenuVisible && props.haveContextMenu"
      ref="tableContainer"
      class="context-menu"
      :style="contextMenuPosition"
    >
      <ElMenu
        class="el-menu-vertical-demo"
        @click="handleMenuClick"
      >
        <ElMenuItem index="1" @click="checkIsTankNoRequired()">
          {{ t('recipe.requestSelectedStep') }}
        </ElMenuItem>
        <ElMenuItem index="2" @click="changeDialog = true">
          {{ t('recipe.changeSelectedStepAmount') }}
        </ElMenuItem>
        <ElMenuItem index="3" @click="showLogsOfSelectedStep">
          {{ t('recipe.showLogsSelectedStep') }}
        </ElMenuItem>
      </ElMenu>
    </div>
    <q-dialog v-model="requestDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="text-h6"> {{ t('recipe.prioritySelect') }}</span>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="priority"
            filled
            :options="priorityOptions"
          />
        </q-card-section>
        <q-card-section v-if="isTankNoRequired">
          <span class="text-h6"> {{ t('recipe.inputTankNo') }}</span>
        </q-card-section>
        <q-card-section v-if="isTankNoRequired">
          <q-input
            v-model="tankNo"
            filled
            @keydown="(e) => onKeydownPreventNonNumerical(e, tankNo)"
            @paste="onPastePreventNonNumerical"
            @drop="onDrop"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :label="t('settings.cancel')"
            outline
            icon="close"
            @click="tankNo = null, priority = null, materials = []"
          />
          <q-btn
            v-close-popup
            outline
            :label="t('submit')"
            icon="check"
            :disable="isTankNoRequired ? !(tankNo && priority) : !priority"
            @click="confirmationDialog = true"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="confirmationDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar
            icon="help"
            color="white"
          />
          <span class="q-ml-sm"> {{ selectedRow.chemCode }} {{ t('recipe.requestConfirmation') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :label="t('no')"
            outline
            icon="close"
            @click="tankNo = null, priority = null, materials = []"
          />
          <q-btn
            v-close-popup
            outline
            :label="t('yes')"
            icon="check"
            @click="requestRow()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="changeDialog" persistent>
      <q-card>
        <q-card-section class="row items-center flex m-5">
          <span class="text-h6"> {{ selectedRow.chemCode }} - {{ selectedRow.materialName }} - {{ (selectedRow.amount).toFixed(2) }} {{ selectedRow.unit }}</span>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="changeValue"
            class="mx-5"
            filled
            :label="t('recipe.newAmount')"
            @keydown="(e) => onKeydownPreventNonNumerical(e, changeValue)"
            @paste="onPastePreventNonNumerical"
            @drop="onDrop"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :label="t('settings.cancel')"
            outline
            icon="close"
            @click="changeValue = null"
          />
          <q-btn
            v-close-popup
            outline
            :label="t('settings.submit')"
            icon="check"
            @click="changeRow()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style lang="postcss">
.selected-blue {
  background-color: #b8dfff !important;
}
.el-table {
  --el-table-border: 1.5px solid #999999;
}

.el-table thead.is-group th.el-table__cell {
  background: #00000040;
}
.context-menu {
  position: fixed;
  z-index: 2000;
}
.normal-class {
  background: scroll !important;
}
.green-class {
  background: rgba(40, 220, 40, 0.6) !important;
}
.orange-class {
  background: rgba(235, 155, 36, 0.6) !important;
}
.blue-class {
  background: rgba(40, 220, 220, 0.6) !important;
}
.red-class {
  background: rgba(250, 151, 175, 0.6) !important;
}
.aqua-class {
  background: rgba(144, 245, 245, 0.6) !important;
}
.violet-class {
  background: rgba(225, 145, 250, 0.6) !important;
}
@media screen and (max-width: 735px) {
  .disable {
    display: none !important;
  }
}

@media (min-width: 600px) {
  .prev-logs-class .q-dialog__inner--minimized > div {
    max-width: 100%;
  }
}
@media (min-width: 735px) and (max-width: 1350px) {
  .el-table--small .el-table__cell {
    padding: 0 !important;
  }
}

.context-menu {
  border-width: 1px;
  border-radius: 2px;
}
</style>
