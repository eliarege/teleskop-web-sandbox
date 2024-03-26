<script setup lang="ts">
const props = defineProps<{ planKey: number }>()

const { t } = useI18n()

const { data: planParameters } = await useFetch('/api/planParameters', {
  query: { planKey: props.planKey },
})
const columns = computed(() => {
  return [
    { name: 'id', label: t('id'), align: 'center', field: 'id' },
    { name: 'paramString', label: t('param-string'), align: 'center', field: 'paramString' },
    { name: 'value', label: t('value'), align: 'center', field: 'value' },
  ]
})
</script>

<template>
  <div class="max-h-200 overflow-auto bg-white">
    <QTable
      class="my-sticky-header-table"
      :rows="planParameters"
      :columns="columns"
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
                type="textarea"
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
