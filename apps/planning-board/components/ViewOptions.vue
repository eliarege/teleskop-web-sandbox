<script setup lang="ts">
import { LoadingSpinner } from 'ui'

const emit = defineEmits(['updateScheduler'])
const { t } = useI18n()
const definitions = ref()
const plannedDefinitions = ref()
const unplannedDefinitions = ref()
const currentMachine = ref()
const selectedRow = ref()
const { data: machines, pending } = await useFetch('/api/machineList')
async function getErpParameters(machineId: number) {
  currentMachine.value = machineId
  const res = await $fetch('/api/erpParameters', {
    query: { machineId },
  })
  definitions.value = res.definitions
  plannedDefinitions.value = res.plannedDefinitions.sort((a, b) => a.paramName < b.paramName ? -1 : 1)
  unplannedDefinitions.value = res.unplannedDefinitions.sort((a, b) => a.paramName < b.paramName ? -1 : 1)
}

const erpParameterColumns = reactive([
  { name: 'id', label: t('erp-param-columns.id'), align: 'center', field: 'id' },
  { name: 'paramName', align: 'center', label: t('erp-param-columns.param-name'), field: 'paramName' },
  { name: 'erpFieldName', align: 'center', label: t('erp-param-columns.field-name'), field: 'erpFieldName' },
])

function contextMenu(row: any) {
  selectedRow.value = row
}
async function addParameter(paramId: number, owner: number, machineId: number) {
  await $fetch('/api/addErpParameters', {
    method: 'POST',
    query: { paramId, owner, machineId },
  })
}
async function onPlannedCtx() {
  const newParam = {
    paramId: selectedRow.value.id,
    owner: 117,
    machineId: currentMachine.value,
    paramName: selectedRow.value.paramName,
  }
  plannedDefinitions.value.push(newParam)
  await addParameter(newParam.paramId, newParam.owner, newParam.machineId)
}
const q = useQuasar()
async function deleteParameter(paramId: number, owner: number, machineId: number) {
  q.dialog({
    title: 'Are you sure to delete this parameter?',
    class: 'e-border',
    ok: {
      push: true,
      label: 'OK',
      color: 'primary',
    },
    cancel: {
      push: true,
      label: 'CANCEL',
      color: 'red',
    },
  }).onOk(async () => {
    await $fetch('/api/deleteErpParameters', {
      method: 'DELETE',
      query: { paramId, owner, machineId },
    }).then(() => {
      getErpParameters(machineId)
      emit('updateScheduler')
    })
  })
}
async function onUnplannedCtx() {
  const newParam = {
    paramId: selectedRow.value.id,
    owner: 118,
    machineId: currentMachine.value,
    paramName: selectedRow.value.paramName,
  }
  unplannedDefinitions.value.push(newParam)
  await addParameter(newParam.paramId, newParam.owner, newParam.machineId)
}
</script>

<template>
  <div class="view-options">
    <div class="machine-list relative">
      <LoadingSpinner v-if="pending" />
      <q-list v-else dense>
        <q-item
          v-for="(item, idx) in machines"
          :key="idx"
          v-ripple
          clickable
        >
          <q-item-section @click="getErpParameters(item.id)">
            {{ item.name }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div class="erp-parameters">
      <QTable
        dense
        :rows="definitions"
        :columns="erpParameterColumns"
        :rows-per-page-options="[0]"
        @row-contextmenu="(evt, row, i) => contextMenu(row)"
      />
      <QMenu context-menu>
        <QList class="flex flex-col p-3 gap-2 bg-gray-300 rounded">
          <QBtn
            :disabled="plannedDefinitions.map(a => a.paramName).includes(selectedRow.paramName)"
            label="Add to planned Batch"
            class="bg-white"
            @click="onPlannedCtx()"
          />
          <QBtn
            :disabled="unplannedDefinitions.map(a => a.paramName).includes(selectedRow.paramName)"
            label="Add to unplanned Batch"
            class="bg-white"
            @click="onUnplannedCtx()"
          />
        </QList>
      </QMenu>
    </div>
    <div class="planned-batch">
      <QTable
        dense
        :rows="plannedDefinitions"
        :columns="[{ name: 'paramName', align: 'center', label: t('erp-param-columns.param-name'), field: 'paramName' }]"
        :rows-per-page-options="[0]"
      >
        <template #header="prop">
          <q-tr :props="prop">
            <q-th
              v-for="col in prop.cols"
              :key="col.name"
              :props="prop"
            >
              {{ col.label }}
            </q-th>
            <q-th auto-width>
              Delete
            </q-th>
          </q-tr>
        </template>
        <template #body="prop">
          <q-tr :props="prop">
            <q-td
              v-for="col in prop.cols"
              :key="col.name"
              :props="prop"
            >
              {{ col.value }}
            </q-td>
            <q-td class="flex justify-center items-center">
              <q-icon
                name="delete"
                color="red"
                size="sm"
                class="cursor-pointer"
                @click="deleteParameter(prop.row.paramId, prop.row.owner, prop.row.machineId)"
              />
            </q-td>
          </q-tr>
        </template>
      </QTable>
    </div>
    <div class="unplanned-batch">
      <QTable
        dense
        :rows="unplannedDefinitions"
        :columns="[{ name: 'paramName', align: 'center', label: t('erp-param-columns.param-name'), field: 'paramName' }]"
        :rows-per-page-options="[0]"
      >
        <template #header="prop">
          <q-tr :props="prop">
            <q-th
              v-for="col in prop.cols"
              :key="col.name"
              :props="prop"
            >
              {{ col.label }}
            </q-th>
            <q-th auto-width>
              Delete
            </q-th>
          </q-tr>
        </template>
        <template #body="prop">
          <q-tr :props="prop">
            <q-td
              v-for="col in prop.cols"
              :key="col.name"
              :props="prop"
            >
              {{ Array.isArray(col.value) ? Object.create(col.value) : col.value }}
            </q-td>
            <q-td auto-width>
              <q-icon
                name="delete"
                color="red"
                size="sm"
                class="cursor-pointer"
                @click="deleteParameter(prop.row.paramId, prop.row.owner, prop.row.machineId)"
              />
            </q-td>
          </q-tr>
        </template>
      </QTable>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.view-options {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  @apply grid gap-2;

  .machine-list {
    grid-area: 1 / 1 / 3 / 2;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .erp-parameters {
    grid-area: 1 / 2 / 3 / 3;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-80vh overflow-auto;
  }

  .planned-batch {
    grid-area: 1 / 3 / 2 / 4;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-40vh overflow-auto;
  }

  .unplanned-batch {
    grid-area: 2 / 3 / 3 / 4;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply max-h-40vh overflow-auto;
  }
}
</style>

<i18n lang="json">
  {
  "en": {
    "erp-param-columns": {
      "id": "Queue Number",
      "param-name": "Parameter Name",
      "field-name": "ERP Matching Area"
    },
    "batch-text": {
      "job-order": "Job Order Number",
      "party": "Party Number",
      "customer": "Customer Name"
    }
  },
  "tr": {
    "erp-param-columns": {
      "id": "Sıra Numarası",
      "param-name": "Parametre İsmi",
      "field-name": "ERP Eşleştirme Alanı"
    },
    "batch-text": {
      "job-order": "İş Emri Numarası",
      "party": "Parti Numarası",
      "customer": "Müşteri İsmi"
    }
  }
}
</i18n>
