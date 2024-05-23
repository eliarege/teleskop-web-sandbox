<script setup lang="ts">
import type { QTableProps } from 'quasar'

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const { data: rows, pending } = useFetch('/api/properties', {
  default: () => [],
  transform(input) {
    return Object.entries(input)
      .map(([key, value]) => ({ key, value }))
  },
})
const columns: QTableProps['columns'] = [
  {
    name: 'key',
    field: 'key',
    label: '',
    align: 'left',
    format: (v: string) => t(`base.${v}`),
  },
  {
    name: 'value',
    field: 'value',
    label: '',
  },
]
</script>

<template>
  <QDialog ref="dialogRef" @hide="onDialogHide">
    <QCard>
      <QCardSection class="w-80 flex items-center pb-0">
        <div class="text-6">
          About
        </div>
        <QSpace />
        <QBtn
          icon="close"
          flat
          round
          dense
          @click="onDialogCancel"
        />
      </QCardSection>
      <QCardSection class="text-4">
        <QTable
          flat
          dense
          hide-header
          hide-bottom
          :rows
          :columns
          :loading="pending"
        />
      </QCardSection>
    </QCard>
  </QDialog>
</template>
