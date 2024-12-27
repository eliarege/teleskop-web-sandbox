<script setup lang="ts">
import { format } from 'date-fns'
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  interventions: Array,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const cols = [
  { name: 'time', align: 'left', label: t('date'), field: 'time', sortable: true, format: e => format(e, 'HH:mm:ss dd/MM/yyyy') },
  { name: 'explanation', align: 'left', label: t('description'), field: 'explanation' },
]
const filter = ref('')

function printTable() {
  const printWindow = window.open('', '_blank')
  if (!printWindow)
    return
  printWindow.document.open()
  printWindow.document.write(`<html><head><title>${t('interventions')}</title><style>body { font-family: Arial, sans-serif; } .row { margin-bottom: 10px; }</style></head><body>`)

  props.interventions?.forEach((intervention) => {
    const timeFormatted = cols.find(col => col.field === 'time')?.format(intervention.time)
    const explanation = intervention.explanation[0]
    printWindow.document.write(`<div class="row"><strong>${t('date')}:</strong> ${timeFormatted} ->> <strong>${t('description')}:</strong> ${explanation}</div>`)
  })

  printWindow.document.write('</body></html>')
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
};
</script>

<template>
  <q-dialog
    ref="dialogRef"
  >
    <q-card>
      <q-card-section>
        <q-table
          :pagination="{ rowsPerPage: 50 }"
          dense
          class="min-w-150 flex interventions-table max-h-150"
          :title="t('interventions')"
          :rows="interventions"
          :columns="cols"
          :filter="filter"
        >
          <template #top-right>
            <q-input
              v-model="filter"
              borderless
              dense
              debounce="300"
              :placeholder="t('search')"
            >
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
          <template #body="bodyProps">
            <q-tr :props="bodyProps" @dblclick="onDialogOK(bodyProps.row.time)">
              <q-td
                v-for="(col, index) in bodyProps.cols"
                :key="`${index}intervention`"
              >
                {{ col.field === 'explanation' ? col.value[0] : col.value }}
                <q-tooltip v-if="col.field === 'explanation'">
                  <div
                    v-for="exp in col.value"
                    :key="exp"
                  >
                    {{ exp }}
                  </div>
                </q-tooltip>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          outline
          :label="t('topbar.graph.print')"
          color="black"
          icon="print"
          @click="printTable()"
        />
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
  .q-dialog__inner--minimized > div {
  max-width: none;
}
</style>
