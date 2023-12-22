<script setup lang="ts">
const props = defineProps<{ planKey: number }>()
const { data: planParameters } = await useFetch('/api/planParameters', {
  query: { planKey: props.planKey },
})
const columns = computed(() => {
  return [
    { name: 'id', label: 'Parameter ID', align: 'center', field: 'id' },
    { name: 'paramString', label: 'Parameter', align: 'center', field: 'paramString' },
    { name: 'value', label: 'Value', align: 'center', field: 'value' },
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
            <q-popup-edit
              v-slot="scope"
              v-model="prop.row.paramString"
              buttons
            >
              <!-- TODO: @save -->
              <q-input
                v-model="scope.value"
                type="textarea"
                dense
              />
            </q-popup-edit>
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
