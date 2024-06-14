<script setup lang="ts">
import { LoadingSpinner } from 'ui'
import { getUnitById } from '~/shared/enums'

const props = defineProps<{ planKey: number }>()

const { t } = useI18n()

const { data: planParameters, pending } = useFetch('/api/planParameters', {
  query: { planKey: props.planKey },
})
const parameterData = ref([] as { id: number, paramString: string, value: string | number }[])
watch(planParameters, (newParams) => {
  parameterData.value = newParams
})
const columns = computed(() => {
  return [
    { name: 'paramString', label: t('param-string'), align: 'center', field: 'paramString' },
    { name: 'value', label: t('value'), align: 'center', field: 'value' },
  ]
})
</script>

<template>
  <LoadingSpinner v-if="pending" has-background />
  <div class="bg-white px-5">
    <QTable
      :title="t('title')"
      class="border-solid border-1px border-gray-500/50"
      title-class="!font-extrabold"
      table-header-class="!font-extrabold"
      flat
      :rows="parameterData"
      :columns="columns"
      hide-pagination
      dense
      :rows-per-page-options="[0]"
      no-data-label="No Parameter"
    >
      <template #header="prop">
        <q-tr :props="prop">
          <q-th
            v-for="col in prop.cols"
            :key="col.name"
            :props="prop"
            class="!font-extrabold"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template #body="prop">
        <!-- TODO: v-if="!batch.isStarted" -->
        <q-tr :props="prop">
          <q-td key="id" :props="prop">
            {{ prop.row.id }}
          </q-td>
          <q-td key="paramString" :props="prop">
            {{ prop.row.paramString }}
          </q-td>
          <q-td key="value" :props="prop">
            {{ prop.row.value }} {{ getUnitById(prop.row.unitCode) }}
            <q-popup-edit
              v-slot="scope"
              v-model="prop.row.value"
              buttons
            >
              <!-- TODO: @save -->
              <q-input
                v-model="scope.value"
                dense
                autofocus
              />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </QTable>
  </div>
</template>

<i18n lang="json">
  {
  "en": {
    "title": "Plan Parameters",
    "id": "Parameter ID",
    "param-string": "Parameter",
    "value": "Value"
  },
  "tr": {
    "title": "Plan Parametreleri",
    "id": "Parametre ID",
    "param-string": "Parametre",
    "value": "Değer"
  }
}
</i18n>
