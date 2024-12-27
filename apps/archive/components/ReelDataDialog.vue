<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { computed } from 'vue'
import type { Reel } from '~/types/archive'

const props = defineProps<{
  cycleTimes: Reel[] // Array of reels with cycle data
}>()

const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()

// Dynamic Columns: Generate headers dynamically based on reel count
const dynamicColumns = computed(() => {
  const baseColumns = [
    {
      name: 'index',
      label: `${t('cycleCount')}`,
      align: 'center',
      field: 'index',
    },
  ]
  const reelColumns = props.cycleTimes.map((reel, index) => ({
    name: `reel${index + 1}`,
    label: `${t('reel')} ${index + 1} (${t('sec')})`,
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
  <q-dialog ref="dialogRef">
    <q-card>
      <q-card-section>
        <div>
          <div class="text-2xl">
            {{ t("reelDataDialog") }}
          </div>
        </div>
      </q-card-section>

      <!-- Table Section -->
      <q-card-section class="max-h-150 w-full overflow-y-scroll">
        <q-table
          flat
          bordered
          :rows="formattedRows"
          :columns="dynamicColumns"
          row-key="index"
          hide-bottom
          dense
          :pagination="{ rowsPerPage: 0 }"
        >
          <template #body-cell="props">
            <q-td :props="props">
              {{ props.value }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>

      <!-- Dialog Actions -->
      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('close')"
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
