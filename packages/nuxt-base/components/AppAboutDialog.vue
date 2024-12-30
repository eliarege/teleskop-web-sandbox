<script setup lang="ts">
import type { QTableProps } from 'quasar'
import { useAppProps } from '../composables/useAppProps'

defineEmits([...useDialogPluginComponent.emits])

const { t, d } = useI18n()
const appProps = useAppProps()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const buildDate = new Date(appProps.buildDate)
const buildDateString = !Number.isNaN(buildDate.getTime()) ? d(buildDate, 'datetime') : ''

const appPropRows = [
  { key: t('base.name'), value: appProps.name },
  { key: t('base.version'), value: appProps.version },
  { key: t('base.buildDate'), value: buildDateString },
  { key: t('base.commitHash'), value: appProps.commitHash },
  { key: t('base.nodeVersion'), value: appProps.nodeVersion },
]
const columns: QTableProps['columns'] = [
  {
    name: 'key',
    field: 'key',
    label: '',
    align: 'left',
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
    <QCard class="min-w-80">
      <QCardSection class="flex items-center pb-0">
        <div class="text-6">
          {{ t('base.about') }}
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
          :rows="appPropRows"
          :columns
        />
      </QCardSection>
    </QCard>
  </QDialog>
</template>
