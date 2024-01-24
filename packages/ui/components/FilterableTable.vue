<script setup lang="ts">
import { ref } from 'vue'
import type { Column, DateType, FilterSlot } from 'ui-types'

// @ts-expect-error nuxt import
import { useI18n } from '#imports'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Array<Column>,
    required: true,
  },
  isExpandable: Boolean,
  customSortMethod: {
    type: Function,
    required: false,
  },
  filterSlots: {
    type: Array<FilterSlot>,
    required: false,
  },
  pagination: {
    type: Object,
    default: () => ({
      descending: false,
      page: 1,
      rowsPerPage: 20,
      sortBy: '',
    }),
    validator: (obj: any): boolean => {
      return 'descending' in obj && typeof obj.descending === 'boolean'
        && 'page' in obj && typeof obj.page === 'number'
        && 'rowsPerPage' in obj && typeof obj.rowsPerPage === 'number'
        && 'sortBy' in obj && typeof obj.sortBy === 'string'
    },
  },
})
const emit = defineEmits(['rowDblclick', 'updateFilterSlots'])

const { t } = useI18n()
function handleDoubleClick(row: any) {
  emit('rowDblclick', row)
}
const { rows, columns } = toRefs(props)
const visibleColumns = ref([])
const showVisibilityMenu = ref(false)
const tableFilter = ref()
columns.value.forEach((row) => {
  if (typeof row.field === 'function')
    row.field = row.field(row)
  visibleColumns.value.push(row.field)
})
const comparisonOperations = [
  { text: 'equals', symbol: '=' },
  { text: 'bigger than', symbol: '>' },
  { text: 'bigger than or equal ', symbol: '>=' },
  { text: 'smaller than', symbol: '<' },
  { text: 'smaller then or equal', symbol: '<=' },
  { text: 'between', symbol: 'bt' },
]

const tablePagination = ref(props.pagination)

const today = new Date()
const startOfToday = new Date(today)
startOfToday.setHours(0, 0, 0, 0)
const dateOptions = ref<DateType[]>([
  { text: 'Today', from: startOfToday, to: today },
  { text: 'Yesterday', from: new Date(new Date().setDate(new Date().getDate() - 1)), to: new Date(new Date().setDate(new Date().getDate() - 1)) },
  { text: 'Last 7 Days', from: new Date(new Date().setDate(new Date().getDate() - 7)), to: new Date() },
  { text: 'Last 30 Days', from: new Date(new Date().setDate(new Date().getDate() - 30)), to: new Date() },
  {
    text: 'Last Week',
    from: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 7)),
    to: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 1)),
  },
  {
    text: 'Last Month',
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
  },
  {
    text: 'Last 3 Month',
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    to: new Date(),
  },
  {
    text: 'Last 12 Month',
    from: new Date(new Date().getFullYear() - 1, new Date().getMonth() + 1, 1),
    to: new Date(),
  },
  // For custom, you can fill this out based on user input
  { text: 'Custom', from: new Date(), to: new Date() },
])

const filterSlots = props.filterSlots ? ref<FilterSlot[]>(props.filterSlots) : ref<FilterSlot[]>([])

const dateTabPanel = ref('intervals')

const currentColumn = ref<string | null>(null)

function openMenu(columnName: string) {
  currentColumn.value = columnName
}

const selectedOptions = ref(Array(columns.value.length).fill(null))

function removeFilter(index: number) {
  if (filterSlots.value[index]?.isOrderFilter)
    tablePagination.value.sortBy = ''
  filterSlots.value.splice(index, 1)
}

function contains(list: Array<any>, elem: any) {
  const contains = list.some((element) => {
    return JSON.stringify(elem) === JSON.stringify(element)
  })
  return contains
}

function pushToFilters(col: Column, index: number, orderByType?: string) {
  let temp
  if (orderByType) { // FIXME: Now its guaranteed that filterType is exist but if the column is not ilterable and wanted to order it will not possible
    temp = { label: `${col.label} in ${orderByType} order`, field: col.field, isOrderFilter: true, value: { direction: orderByType === 'ascending' ? 'asc' : 'desc' }, filterType: col.filterType }
    filterSlots.value.forEach((filter, index) => {
      if (filter.isOrderFilter)
        filterSlots.value.splice(index, 1)
    })
    filterSlots.value.push(temp)
  }
  // If the filterType is date the index parameter will be the index of dateOptions
  else if (col.filterType === 'date') {
    const selectedDate: DateType = dateOptions.value[index]
    if (selectedDate.text) {
      temp = { label: `${col.label} in ${selectedDate.text}`, field: col.field, value: { from: selectedDate.from, to: selectedDate.to }, filterType: col.filterType }
    } else {
      temp = { label: `${col.label} from ${selectedDate.from} to ${selectedDate.to}`, field: col.field, value: { from: selectedDate.from, to: selectedDate.to }, filterType: col.filterType }
    }
    if (!contains(filterSlots.value, temp))
      filterSlots.value.push(temp)
  } else {
  // If the filterType is not date the index parameter will be the index of selectionOptions
    const name = col.label
    const option = selectedOptions.value[index]
    let optionLabel = ''
    if (col.optionLabel) {
      if (col.filterType === 'multiselect')
        option.forEach(opt => optionLabel += `${opt[col.optionLabel]} `)
      else
        optionLabel = option[col.optionLabel]
    } else
      optionLabel = option
    const filterType = col.filterType
    if (filterType === 'select' || filterType === 'multiselect' || filterType === 'boolean') {
      temp = { label: `${name} is ${optionLabel}`, field: col.field, value: { option: [option] }, filterType, optionValue: col.optionValue }
      if (filterType === 'multiselect')
        temp.value.option = option
      if (!contains(filterSlots.value, temp) && option !== null) {
        filterSlots.value.push(temp)
      }
    }
    if (col.filterType === 'equals' || col.filterType === 'includes') {
      temp = { label: `${name} ${col.filterType} ${option} `, field: col.field, value: option, filterType: col.filterType }
      if (!contains(filterSlots.value, temp))
        filterSlots.value.push(temp)
    }
    if (col.filterType === 'comparison' && option && option.number1) {
      if (option.operator.text === 'between' && option.number2) {
        const min = Math.min(option.number1, option.number2)
        const max = Math.max(option.number1, option.number2)
        temp = { label: `${name} between ${min} and ${max}`, field: col.field, value: { min, max }, filterType: col.filterType }
      } else {
        temp = { label: `${name} ${option.operator.symbol} ${option.number1}`, field: col.field, value: { operator: option.operator.symbol, number: option.number1 }, filterType: col.filterType }
      }
      if (!contains(filterSlots.value, temp))
        filterSlots.value.push(temp)
    }
  }
  console.log(filterSlots.value)
}

function comparisonOptionInit(index: number) {
  if (!selectedOptions.value[index])
    selectedOptions.value[index] = { operator: { text: 'equals', symbol: '=' } }
}
function updateSortOrder(col: Column, index: number, isDescending: boolean) {
  tablePagination.value.sortBy = col.field
  tablePagination.value.descending = isDescending
  pushToFilters(col, index, isDescending ? 'descending' : 'ascending')
}

watch(filterSlots.value, (newValue) => {
  emit('updateFilterSlots', newValue)
})
</script>

<template>
  <div>
    <q-table
      v-model:pagination="tablePagination"
      :rows="rows"
      :columns="columns"
      row-key="id"
      :sort-method="props?.customSortMethod"
      flat
      bordered
      virtual-scroll
      :virtual-scroll-sticky-size-start="48"
      class="text-override-left filterable-table my-sticky-virtscroll-table-recipe"
      column-sort-order="da"
      :visible-columns="visibleColumns"
      :filter="tableFilter"
    >
      <template #top>
        <div class="flex w-full flex-nowrap">
          <div
            class="flex flex-col gap-5 border-1 border-black p-1 h-12 border-rounded"
            :style="showVisibilityMenu ? 'width: 40%' : ''"
          >
            <div
              class="w-10 h-10 flex items-center justify-center color-black cursor-pointer"
              @click="showVisibilityMenu = !showVisibilityMenu"
            >
              <q-icon name="filter_alt" size="1.5rem" />
            </div>
            <div
              v-if="showVisibilityMenu"
              class="flex"
            >
              <q-input
                v-model="tableFilter"
                borderless
                dense
                debounce="300"
                :placeholder="t('search')"
              />
              <!-- TODO: If the section would be settings this displayment is much better -->
              <q-select
                v-model="visibleColumns"
                multiple
                borderless
                dense
                options-dense
                :display-value="$q.lang.table.columns"
                emit-value
                map-options
                :options="columns"
                option-value="name"
                style="min-width: 150px"
              />
            </div>
          </div>
          <div class="flex gap-x-5 gap-y-1 px-5 w-full">
            <div
              v-for="(filter, index) in filterSlots"
              :key="index"
              class="filter-slots"
              :style="filter.isOrderFilter
                ? 'background-color: rgba(124, 196, 255, 0.185); color: #509ee3;'
                : 'background-color: rgba(0, 0, 0, 0.1); color: black;'"
            >
              {{ filter.label }} &nbsp;&nbsp;
              <q-icon name="close" @click="removeFilter(index)" />
            </div>
          </div>
          <div>
            <slot name="top-right" />
          </div>
        </div>
      </template>
      <template #header="tableProps">
        <q-tr :props="tableProps">
          <q-th v-if="props.isExpandable" style="width: 5rem; max-width: 20%" />
          <q-th
            v-for="(col, index) in tableProps.cols"
            :key="col.name"
            :props="tableProps"
          >
            <div
              class="column-group text-override-left-header"
              :style="col.filterable ? 'cursor: pointer;' : ''"
              @click="openMenu(col.name)"
            >
              {{ col.label }}
              <q-icon v-if="col.filterable" name="expand_more" />
            </div>
            <q-menu
              v-if="currentColumn === col.name && col.filterable "
              style=""
            >
              <q-list class="mx-4 mb-3 mt-2">
                <div class="flex items-center justify-center gap-5 h-12">
                  <q-btn
                    v-for="arrow in ['arrow_downward', 'arrow_upward']"
                    :key="arrow"
                    v-close-popup
                    :icon="arrow"
                    class="ordering-buttons"
                    @click="updateSortOrder(col, index, arrow === 'arrow_downward')"
                  />
                </div>
                <q-separator />
                <div v-if="col.filterType === 'multiselect' || col.filterType === 'select'">
                  <q-select
                    v-model="selectedOptions[index]"
                    :options="col.selectionOptions"
                    :option-label="col?.optionLabel"
                    :option-value="col?.optionvalue"
                    clearable
                    :multiple="col.filterType === 'multiselect'"
                    label="Select an option"
                    style="width: 150px;"
                  />
                </div>
                <div v-if="col.filterType === 'comparison'" class="flex flex-row justify-center items-center">
                  {{ col.label }}
                  {{ comparisonOptionInit(index) }}
                  <q-select
                    v-model="selectedOptions[index].operator"
                    :options="comparisonOperations"
                    option-label="symbol"
                    style="width: 80px;"
                    filled
                    item-aligned
                    dense
                    class="select-dropdown-removal"
                  />
                  <span class="flex items-center">
                    <q-input
                      v-if="selectedOptions[index]?.operator"
                      v-model="selectedOptions[index].number1"
                      filled
                      clearable
                      dense
                      style="width: 100px;"
                    />
                    <span v-if="selectedOptions[index]?.operator?.text === 'between'" class="flex items-center">
                      &nbsp; and &nbsp;
                      <q-input
                        v-model="selectedOptions[index].number2"
                        filled
                        clearable
                        dense
                        style="width: 100px;"
                      />
                    </span>
                  </span>
                </div>
                <div v-if="col.filterType === 'equals' || col.filterType === 'includes'" class="flex flex-row justify-center items-center mt-5">
                  {{ `${col.label}  ${t(`${col.filterType}`)} ` }} &nbsp;
                  <span class="flex items-center">
                    <q-input
                      v-model="selectedOptions[index]"
                      filled
                      clearable
                      dense
                      style="width: 100px;"
                    />
                  </span>
                </div>
                <div v-if="col.filterType === 'date'">
                  <q-tabs
                    v-model="dateTabPanel"
                    dense
                    class="text-grey"
                    active-color="black"
                    indicator-color="black"
                    align="justify"
                    narrow-indicator
                  >
                    <q-tab name="intervals" label="Intervals" />
                    <q-tab name="custom" label="Custom" />
                  </q-tabs>

                  <q-separator />
                  <q-tab-panels v-model="dateTabPanel" animated>
                    <q-tab-panel name="intervals">
                      <span
                        v-for="(date, indexInner) in dateOptions"
                        :key="date.text"
                      >
                        <q-item
                          v-if="date.text !== 'Custom'"
                          v-close-popup
                          clickable
                          @click="pushToFilters(col, indexInner)"
                        >
                          <q-item-section>{{ date.text }}</q-item-section>
                        </q-item>
                        <q-separator v-if="indexInner === 3" />
                      </span>
                    </q-tab-panel>

                    <q-tab-panel name="custom" class="m-0">
                      <q-date
                        v-model="dateOptions[8]"
                        range
                        minimal
                        square
                        flat
                        bordered
                      >
                        <template #default>
                          <q-btn
                            @click="pushToFilters(col, 8)"
                          >
                            <!-- FIXME: HARDOCDED: '8' is the index of custom object of dateOptions array if more spesific intervals added it should be changed -->
                            Add
                          </q-btn>
                        </template>
                      </q-date>
                    </q-tab-panel>
                  </q-tab-panels>
                </div>
                <div v-if="col.filterType === 'boolean'">
                  <q-radio
                    v-model="selectedOptions[index]"
                    label="True"
                    :val="1"
                  />
                  <q-radio
                    v-model="selectedOptions[index]"
                    label="False"
                    :val="0"
                  />
                </div>
                <div class="flex justify-end">
                  <q-btn
                    v-if="col.filterType !== 'date' && col.filterType"
                    class="mt-5 mb-1"
                    style="color: rgb(0, 0, 0);"

                    @click="pushToFilters(col, index)"
                  >
                    Add
                  </q-btn>
                </div>
              </q-list>
            </q-menu>
          </q-th>
        </q-tr>
      </template>
      <template #body="bodyProps">
        <slot name="custombody" v-bind="bodyProps">
          <q-tr :props="bodyProps">
            <q-td
              v-for="col in bodyProps.cols"
              :key="col.name"
              class="row-class"
              :props="bodyProps"
              @dblclick="handleDoubleClick(bodyProps.row)"
            >
              {{ col.value }}
            </q-td>
          </q-tr>
        </slot>
      </template>
    </q-table>
  </div>
</template>

<style scoped>
.my-sticky-virtscroll-table-recipe {
  height: 100%;
  min-height: 50vh;
}

.my-sticky-virtscroll-table-recipe :deep(.q-table__top),
.my-sticky-virtscroll-table-recipe :deep(.q-table__bottom),
.my-sticky-virtscroll-table-recipe :deep(thead tr:first-child th) {
  background-color: #ffffff;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr th) {
  position: sticky;
  z-index: 1;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr:last-child th) {
  top: 48px;
}

.my-sticky-virtscroll-table-recipe :deep(thead tr:first-child th) {
  top: 0;
}

.my-sticky-virtscroll-table-recipe :deep(tbody) {
  scroll-margin-top: 48px;
}
.ordering-buttons {
  transition: all 200ms linear 0s;
  color: rgb(0, 0, 0);
  border: 1px solid rgba(0, 0, 0, 0.5);
  font-size: 0.75rem;
  padding: 0rem 1.275rem;
  border-radius: 100px;
  background: transparent;
}
.ordering-buttons:hover {
  color: rgb(255, 255, 255);
  background-color: rgb(0, 0, 0);
  border-color: rgb(0, 0, 0);
}
.filterable-table {
  border: 1px solid rgb(0, 0, 0);
  border-radius: 5px;
  padding: 3px 8px;
}

.filterable-table :deep(.q-table th, .q-table td ) {
  padding: 0.3vw;
}
.filter-slots {
  font-weight: 700;
  border-radius: 8px;
  padding-left: 8px;
  padding-right: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  height: 22px;
}

.row-class {
  cursor: pointer;
}
.column-group {
  width: 100%;
  justify-content: center;
  padding: 0.25em 0.65em;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  color: rgb(0, 0, 0);
  font-size: 12.5px;
  font-weight: 700;
}
.text-override-center :deep(.text-right){
  text-align: center;
  word-break: normal;
  white-space: normal;
}

.select-dropdown-removal :deep(.q-select__dropdown-icon) {
  display: none;
}
.text-override-left :deep(.text-right){
  text-align: left;
  /* word-break: normal;
  white-space: normal; */
}
</style>
