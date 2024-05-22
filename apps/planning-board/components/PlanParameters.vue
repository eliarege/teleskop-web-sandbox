<script setup lang="ts">
import { LoadingSpinner } from 'ui'

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
  <div class="max-h-200 overflow-auto bg-white px-5">
    <h3 class="text-center font-extrabold ">
      Plan Parameters
    </h3>
    <QTable
      class="my-sticky-header-table"
      :rows="parameterData"
      :columns="columns"
      hide-pagination
      dense
      :rows-per-page-options="[0]"
      no-data-label="No Parameter"
    >
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
            {{ prop.row.value }}
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

<i18n>
  {
  "en": {
    "id": "Parameter ID",
    "param-string": "Parameter",
    "value": "Value"
  },
  "tr": {
    "id": "Parametre ID",
    "param-string": "Parametre",
    "value": "Değer"
  }
}
</i18n>
