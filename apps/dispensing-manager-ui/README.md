# Dispensing Manager UI

[Modules](../../packages/nuxt-base/README.md)

# FilterableTable Component

## Overview

`FilterableTable` is a Vue 3 component designed for displaying and interacting with tabular data. It extends the functionality of Quasar's `q-table` by adding features like custom sorting, filtering, and expandability. This component is ideal for applications that require advanced data manipulation within a table format.

## Features

- **Custom Sorting**: Allows sorting of table columns using a custom method.
- **Expandability**: Rows can be expanded to reveal more information.
- **Filtering**: Supports multiple filter types, including comparison, selection, and date-based filters.
- **Pagination**: Implements pagination with customizable settings.

## Props

- `rows`: Array of data objects to be displayed in the table.
- `columns`: Array of `Column` objects defining the columns of the table.
- `isExpandable`: Boolean to enable or disable row expandability.
- `customSortMethod`: (Optional) A function for custom sorting logic.
- `filterSlots`: (Optional) Array of `FilterSlot` objects for predefined filters.
- `pagination`: Object for pagination settings.

> [!WARNING]
> Do not try to define `filterSlots` by yourself. `filterSlots` prop is used to store current filters from table.

## Column Interface

Each column in the `FilterableTable` can be defined using the `Column` interface, which extends Quasar's `QTableColumn`. The `Column` interface includes the following properties:


```ts
export interface Column extends QTableColumn {
  /**
   * Boolean indicating whether the column is filterable.
   */
  filterable?: boolean

  /**
   * Boolean indicating whether the column is sortable. Adds two button represent ascending-descending to filter menu
   */
  sortable?: boolean

  /**
   * String specifying the type of filter. Can be one of 'select', 'multiselect', 'date', 'comparison', 'boolean', 'equals', 'includes'.
   */
  filterType?: 'select' | 'multiselect' | 'date' | 'comparison' | 'boolean' | 'equals' | 'includes'

  /**
   * Array of options necessary if `filterType` is 'select' or 'multiselect'.
   */
  selectionOptions?: Array<any>

  /**
   * String needed if `selectionOptions` is array of objects
   */
  optionLabel?: string

  /**
   * String `optionValue` returns specified value on 'select' and 'multiselect' otherwise returns the whole object
   */
  optionValue?: string
}
```

## Events

- `rowDblclick`: Emitted when a row is double-clicked.
- `updateFilterSlots`: Emitted when filter slots are updated.

## Slots

- `top-right`: Slot for custom content in the top-right area of the table.
- `custombody`: Slot for customizing the body of each row.

## Usage

1. **Basic Setup**:
  Include the component in your template and bind the required props.

  ```html
  <FilterableTable
    :rows="yourData"
    :columns="yourColumns"
    :is-expandable="true"
    :custom-sort-method="yourSortMethod"
  />
  ```
2. **Listening to Events**:
  Listen to rowDblclick and updateFilterSlots events for additional interactions.

  ```html
  <FilterableTable
    ...
    @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
    @row-dblclick="row => handleRowDblClick(row)"
  />
  ```
3. **Using Slots**:
  Utilize slots to add custom content or modify existing content in the table.

  ```html
  <FilterableTable
    ...
  >
    <template #top-right>
      <!-- Your custom content for the top-right area -->
    </template>
    <template #custombody="bodyProps">
      <!-- Your custom content for the table body -->
    </template>
  </FilterableTable>
  ```
4. **Example Columns Array**

```ts
const logCols: Column[] = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    filterable: true,
    filterType: 'comparison'
  },
  {
    name: 'recipe',
    label: 'Recipe',
    field: 'recipe',
    filterable: true,
    filterType: 'select',
    selectionOptions: [
      {
        label: '',
        recipeType: 0
      },
      {
        label: '',
        recipeType: 1
      }
    ],
    optionValue: 'recipeType',
    optionLabel: 'label'
  },
  { name: '', label: '', field: '', filterable: true, filterType: 'date' },
  { name: '', label: '', field: '', filterable: true, filterType: 'includes' },
]

```

5. **Example with Expandable Rows**


```html
  <FilterableTable
    :rows="rows"
    :columns="columns"
    :is-expandable="true"
    :pagination="paginationObject"
    @update:pagination="(newPag) => paginationObject = newPag"
    @update-filter-slots="(evt) => applyFiltersCanceled(evt)"
  >
    <template #top-right>
      <div>
        <q-space />
        <!-- Adds toggle button to top right corner of the table -->
        <q-btn-toggle
          v-model="toggleRef"
          :options="[
            { label: '', value: 'ongoing' },
            { label: '', value: 'cancel' },
          ]"
          @update:model-value="updateRecipeTable()"
        />
      </div>
    </template>
    <template #custombody="props">
      <q-tr :props="props">
        <q-td>
          <!-- is-expandable just make sure the first cell of each row is empty buttons to expand has to be defined by user for now.-->
          <!-- TODO: If rows are expandable user can define custom button. There will be fallback situation. -->
          <q-btn
            size="sm"
            color="accent"
            :icon="props.row.expand ? 'remove' : 'add'"
            @click="someFunc(props.row)"
          />
          <!-- Multiple rows can be expanded at a time. someFunc can be function to make sure only one row is expanded. -->
        </q-td>
        <!-- (Optional) USer defined columns for manipulating table data. -->
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
        >
            {{ col.value }}
        </q-td>
      </q-tr>
      <!-- Example contex menu for rows -->
      <q-menu
        touch-position
        context-menu
      >
        <q-list>
          <q-item
            v-close-popup
            clickable
            @click="handleContextMenuClick()"
          >
            <q-item-section></q-item-section>
          </q-item>
          <q-separator />
          <q-item v-close-popup clickable>
            <q-item-section></q-item-section>
          </q-item>
        </q-list>
      </q-menu>
      <q-tr v-show="props.row.expand" :props="props">
        <q-td colspan="100%">
          <div>
            <!-- Expanded row's inside. -->
          </div>
        </q-td>
      </q-tr>
    </template>
  </FilterableTable>
```

## Filterable Table - Backend Interaction

To integrate the `FilterableTable` with backend data sources and apply filters effectively, the component utilizes the `filtersToKnex` function. This function translates the filter criteria set in the frontend into queries that can be executed by a Knex.js query builder.

```js
export async function filtersToKnex(filters: Array<FilterSlot>, attributes: any, knexInstance: Knex.QueryBuilder)
```

### Usage

Here is the example `handleFilterSlotsUpdate()` function in `update-filter-slots="evt => handleFilterSlotsUpdate(evt)"`

```js
async function handleFilterSlotsUpdate(updatedValue) {
  const data = await $fetch('/api/path-of-endpoint', {
    method: 'post',
    body: {
      filters: updatedValue
    },
  })
}
```

**Example backend endpoint**

Select attributes has to be given to function and the [filtersToKnex]() function handles the where logic according to `filterTypes`

User defines the query logics like joins, orderBys, limit etc... and gives filters, selectParameters and knexQuery to `filtersToKnex` function.

> [!WARNING]
> Avoid using `await` while initializing dataQuery object with knex. If user tries to await knex object it will return data array and query logics cannot be added anymore.


```js
const selectParameters = {
  jobOrder: 'b.BData1',
  correctionNo: 'b.BData2',
  plannedMachineName: 'm.MData1',
  machineid: 'b.BData3',
  programList: 'm.MData2',
  plannedStartTime: 'b.BData5',
}
router.post('/path-of-endpoint', defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const dataQuery: any = knex('BTable as b')
      .select(selectParameters)
      .join('MTable as m', 'b.BData1', 'm.MData1')
      .orderBy(['b.BData1', 'b.BData2'])
    if (body.filters)
      return await filtersToKnex(body.filters, selectParameters, dataQuery)
    else
      return await dataQuery
  } catch (e) {
    return e
  }
}))
```
