<script setup lang="ts">
const emit = defineEmits(['updateScheduler'])

const { t } = useI18n()
const q = useQuasar()

const definitions = ref([] as any[])
const plannedDefinitions = ref([] as any[])
const currentMachine = ref(-1)

const { data: machines } = useFetch('/api/machineList')
const activeMachine = ref(-1)

async function getErpParameters(machineId: number) {
  currentMachine.value = machineId
  const res = await $fetch<{ definitions: any[], plannedDefinitions: any[] }>('/api/settings/erpParameters', {
    query: { machineId },
  })
  definitions.value = res.definitions
  plannedDefinitions.value = res.plannedDefinitions.sort((a, b) => a.paramId < b.paramId ? -1 : 1)
}

const erpParameterColumns = reactive([
  { name: 'paramId', label: t('erp-param-columns.id'), align: 'center', field: 'paramId' },
  { name: 'paramName', align: 'center', label: t('erp-param-columns.param-name'), field: 'paramName' },
])

async function addParameter(id: number, machineId: number) {
  await $fetch('/api/settings/erpParameters/addErpParameters', {
    method: 'PUT',
    query: { id, machineId },
  })
}
async function onPlannedCtx(row: any) {
  plannedDefinitions.value.push(row)
  await addParameter(row.id, row.machineId)
}

async function deleteParameter(id: number, machineId: number) {
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
    await $fetch('/api/settings/erpParameters/deleteErpParameters', {
      method: 'PUT',
      query: { id, machineId },
    }).then(() => {
      getErpParameters(machineId)
      emit('updateScheduler')
    })
  })
}
</script>

<template>
  <div class="view-options">
    <div class="machine-list relative">
      <q-list dense>
        <q-item
          v-for="(item, idx) in machines"
          :key="idx"
          v-ripple
          :active="activeMachine === idx"
          clickable
          @click="activeMachine = idx"
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
              Add
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
            <q-td auto-width>
              <q-btn
                icon="add"
                :disabled="plannedDefinitions.map((a) => a.id).includes(prop.row.id)"
                color="primary"
                size="sm"
                @click="onPlannedCtx(prop.row)"
              />
            </q-td>
          </q-tr>
        </template>
      </QTable>
    </div>
    <div class="planned-batch">
      <q-list
        separator
        bordered
        dense
      >
        <q-item
          v-for="item in plannedDefinitions"
          :key="item.id"
          v-ripple
          clickable
        >
          <q-item-section>
            {{ item.paramName }}
          </q-item-section>
          <q-item-section side>
            <Icon
              name="fluent:delete-16-regular"
              color="red"
              size="20"
              @click="deleteParameter(item.id, item.machineId)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.view-options {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  @apply grid gap-2 h-80vh;

  .machine-list {
    grid-area: 1 / 1 / 3 / 2;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply overflow-auto;
  }

  .erp-parameters {
    grid-area: 1 / 2 / 3 / 3;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply overflow-auto;
  }

  .planned-batch {
    grid-area: 1 / 3 / 3 / 4;
    border: 1px solid rgba(0, 0, 0, 0.125);
    border-radius: 0.25rem;
    @apply overflow-auto;
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
