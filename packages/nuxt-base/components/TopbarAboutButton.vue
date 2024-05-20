<script setup lang="ts">
import type { QTableProps } from 'quasar'

const { t } = useI18n()
const { data: rows } = useFetch('/api/properties', {
  default: () => [],
  transform(input) {
    return Object.entries(input)
      .map(([key, value]) => ({ key, value }))
  },
})
const showDialog = ref(false)
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
  <TopbarButton icon="help_outline" @click="showDialog = true">
    <QDialog v-model="showDialog">
      <QCard>
        <QCardSection class="w-80 flex items-center pb-0">
          <div class="text-6">
            About
          </div>
          <QSpace />
          <QBtn
            v-close-popup
            icon="close"
            flat
            round
            dense
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
          />
        </QCardSection>
      </QCard>
    </QDialog>
  </TopbarButton>
</template>
