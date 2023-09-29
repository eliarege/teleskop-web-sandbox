<script setup lang="ts">
import type { TableColumnCtx } from 'element-plus'
import type { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Recipe } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const props = defineProps({
  data: {
    type: Array as PropType<Recipe[]>,
    required: true,
  },
  show: Boolean,
  title: {
    type: String,
    required: true,
  },
  isFirst: {
    type: Boolean,
    required: true,
  },
})

const { t } = useI18n()

const store = useDataStore()
interface SpanMethodProps {
  row: Recipe
  column: TableColumnCtx<Recipe>
  rowIndex: number
  columnIndex: number
}
// const size = window.innerWidth
const groupables = [
  { key: 'recIndex', index: 0 },
  { key: 'program', index: 1 },
  { key: 'reqNumber', index: 2 },
  { key: 'mainStep', index: 3 },
  // { key: "", index: 7 },
] as { key: keyof Recipe; index: number }[]
function objectSpanMethod({ row, rowIndex, columnIndex }: SpanMethodProps) {
  const property = groupables.find(prop => prop.index === columnIndex)
  if (!property) {
    return { rowspan: 1, colspan: 1 }
  }
  const prevRow = props.data[rowIndex - 1] || {}
  const prevGroupables = groupables.slice(0, columnIndex + 1)
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
function a({ row, columnIndex }: SpanMethodProps) {
  // HARDCODED! columnIndex 4 === chemCode --> veri değişirse değiştir!
  if ((columnIndex === 4 || columnIndex === 5) && row.recType === 1) {
    return 'green-class'
  }
  return 'normal-class'
}
</script>

<template>
  <div class="w-full h-full">
    <ElTable
      :span-method="objectSpanMethod"
      :data="props.data"
      :border="true"
      table-layout="fixed"
      header-cell-class-name="whitespace-nowrap"
      :cell-class-name="a"
      row-class-name="normal-class"
      size="small"
      empty-text="There is no Recipe to show."
      :show-overflow-tooltip="true"
    >
      <ElTableColumn :label="title" align="center">
        <ElTableColumn
          :label="t('details.index')"
          prop="recIndex"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          :label="t('details.program')"
          prop="program"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          :label="t('details.number')"
          prop="reqNumber"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          :label="t('details.main-step')"
          prop="mainStep"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          :label="t('details.chem-code')"
          prop="chemCode"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          :label="t('details.material-name')"
          prop="materialName"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          v-if="store.settings !== '0'"
          label="Faz İndeks"
          prop="phaseIndex"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          v-if="store.settings !== '0'"
          label="Faz Numarası"
          prop="phaseNo"
          align="center"
          show-overflow-tooltip
        />
        <ElTableColumn
          v-if="isFirst"
          align="center"
          class-name="custom-btn"
        >
          <template #header>
            <ElButton
              plain
              color="#0d94fc"
              class="custom-btn"
              @click="store.tableShow = !store.tableShow"
            >
              {{ store.tableShow ? t("details.btn-close") : t("details.btn-open") }}
            </ElButton>
          </template>
          <ElTableColumn
            :label="t('details.amount')"
            prop="newAmount"
            align="center"
            show-overflow-tooltip
          />
        </ElTableColumn>
        <ElTableColumn
          v-else
          :label="t('details.amount')"
          prop="newAmount"
          align="center"
          show-overflow-tooltip
        />
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style lang="postcss">
.normal-class {
  background: scroll !important;
}
.green-class {
  background: rgba(40, 220, 40, 0.6) !important;
}
@media screen and (max-width: 735px) {
  .disable {
    display: none !important;
  }
  .custom-btn {
    @apply hidden;
  }
}
@media (min-width: 735px) and (max-width: 1350px) {
  .el-table--small .el-table__cell {
    padding: 0 !important;
  }
  .custom-btn {
    @apply hidden;
  }
}
</style>
