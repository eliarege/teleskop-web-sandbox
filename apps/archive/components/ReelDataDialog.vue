<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import { useDialogPluginComponent } from 'quasar'
import { computed } from 'vue'
import type { Reel } from '~/types/archive'

const props = defineProps<{
  cycleTimes: Reel[] // Array of reels with cycle data
}>()

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

// Dynamic Columns: Generate headers dynamically based on reel count
const dynamicColumns = computed<QTableColumn[]>(() => {
  const baseColumns: QTableColumn[] = [
    {
      name: 'index',
      label: `${t('cycleCount')}`,
      align: 'center' as const,
      field: 'index',
    },
  ]

  const reelColumns: QTableColumn[] = props.cycleTimes.map((reel, index) => ({
    name: `reel${index + 1}`,
    label: `${t('reel')} ${index + 1}`,
    align: 'center',
    field: `reel${index + 1}`,
  }))

  return [...baseColumns, ...reelColumns]
})

const formattedRows = computed(() => {
  const maxCycles = Math.max(
    ...props.cycleTimes.map(cycle => cycle.cycles.length),
  )

  const rows = Array.from({ length: maxCycles }, (_, i) => {
    const row: Record<string, string | number> = {
      index: `${i + 1}. ${t('cycle')}`,
    }
    props.cycleTimes.forEach((reel, reelIndex) => {
      row[`reel${reelIndex + 1}`] = reel.cycles[i]?.duration || ''
    })
    return row
  })

  return rows
})
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="min-w-[300px]" style="max-width: 90vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('reelDataDialog') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          class="color-gray-6"
          flat
          round
          dense
        />
      </q-card-section>

      <!-- Table Section -->
      <q-card-section class="q-pt-none">
        <div>
          <q-table
            flat
            bordered
            :rows="formattedRows"
            :columns="dynamicColumns"
            row-key="index"
            class="h-140"
            table-header-style="position: sticky; top: 0; z-index: 1;"
            table-header-class="bg-gray-1 dark:bg-dark-4"
            hide-bottom
            dense
            :pagination="{ rowsPerPage: 0 }"
          >
            <template #body-cell="slotProps">
              <q-td :props="slotProps">
                {{ slotProps.value }}
              </q-td>
            </template>

            <template
              v-for="(reel, index) in props.cycleTimes"
              :key="`reel-header-${index}`"
              #[`header-cell-reel${index+1}`]="slotProps"
            >
              <q-th :props="slotProps">
                <div class="column items-center">
                  <div>
                    {{ t('reel') }} {{ index + 1 }} ({{ t('sec') }})
                  </div>
                  <div class="text-caption">
                    {{ reel.cycles.length }} {{ t('cycle') }}
                  </div>
                </div>
              </q-th>
            </template>
          </q-table>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
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
