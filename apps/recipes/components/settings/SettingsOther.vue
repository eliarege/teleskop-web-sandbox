<script lang="ts" setup>
import { useQuasar } from 'quasar'
import type { QTableColumn } from 'quasar'
import CustomerDialog from '../CustomerDialog.vue'
import FabricTypeDialog from '../FabricTypeDialog.vue'
import type { Customer, FabricType } from '~/shared/types'

const q = useQuasar()
const { t } = useI18n()
const tab = ref('customer')
const { notifySuccess, notifyFail } = useNotify()
const customers = ref<Customer[]>([])
const fabrics = ref<FabricType[]>([])
const pagination = ref({ rowsPerPage: 20 })

fetchData()
async function fetchData() {
  try {
    customers.value = await $fetch('/api/customers')
    fabrics.value = await $fetch('/api/fabric-types')
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

const customerColumns: QTableColumn[] = [
  { name: 'id', label: t('Id'), field: 'customerId', align: 'left', sortable: true },
  { name: 'customerNo', label: t('customerFields.No'), field: 'customerNo', align: 'left', sortable: true },
  { name: 'name', label: t('customerFields.Name'), field: 'customerName', align: 'left', sortable: true },
]

const fabricColumns: QTableColumn[] = [
  { name: 'id', label: t('Id'), field: 'fabricTypeId', align: 'left', sortable: true },
  { name: 'name', label: t('fabricTypeFields.Name'), field: 'fabricTypeName', align: 'left', sortable: true },
  { name: 'notes', label: t('fabricTypeFields.Notes'), field: 'fabricTypeNotes', align: 'left' },
]

function onRowClick(row: any, isNew = false) {
  let newId = 1

  if (isNew) {
    if (tab.value === 'customer') {
      const maxId = Math.max(0, ...customers.value.map(c => c.customerId || 0))
      newId = maxId + 1
      row = { customerId: newId, customerNo: '', customerName: '', notes: '' }
    } else {
      const maxId = Math.max(0, ...fabrics.value.map(f => f.fabricTypeId || 0))
      newId = maxId + 1
      row = { fabricTypeId: newId, fabricTypeName: '', fabricTypeNotes: '' }
    }
  }

  q.dialog({
    component: tab.value === 'customer' ? CustomerDialog : FabricTypeDialog,
    componentProps: tab.value === 'customer' ? { customer: row, isNew } : { fabric: row, isNew },
  }).onOk(() => {
    notifySuccess(t('Success'))
    fetchData()
  })
}
</script>

<template>
  <div class="q-gutter-y-md">
    <QTabs
      v-model="tab"
      dense
      align="justify"
      :breakpoint="0"
    >
      <QTab
        name="customer"
        :class="tab === 'customer' ? 'tabs-active' : 'tabs'"
        :label="t('Customers')"
        no-caps
      />
      <QSeparator vertical />
      <QTab
        name="fabric"
        :class="tab === 'fabric' ? 'tabs-active' : 'tabs'"
        :label="t('FabricTypes')"
        no-caps
      />
    </QTabs>

    <QSeparator class="w-full mt-5 mb-5" />
    <div class="flex-center mb-4">
      <QBtn
        :label="t('Add')"
        icon="add"
        no-caps
        color="primary"
        @click="onRowClick({}, true)"
      />
    </div>

    <QTable
      flat
      bordered
      separator="cell"
      :pagination="pagination"
      table-header-class="table-header"
      :columns="tab === 'customer' ? customerColumns : fabricColumns"
      :rows="tab === 'customer' ? customers : fabrics"
      row-key="id"
      @row-click="(_, row) => onRowClick(row)"
    />
  </div>
</template>
