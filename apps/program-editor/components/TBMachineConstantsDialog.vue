<script setup lang="ts">
const props = defineProps<{
  machineConstants: { paramString: string, currentValue: string }[]
}>()

const { t } = useI18n()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <QDialog ref="dialogRef">
    <QCard class="w-120">
      <QCardSection class="row items-center">
        <span class="text-4"> {{ t('machineConstants.title') }}</span>
        <QSpace />
        <QBtn
          v-close-popup
          round
          flat
          size="sm"
          dense
          icon="close"
          class="text-gray-4 dark:text-gray-6"
          @click="onDialogCancel"
        />
      </QCardSection>
      <QTable
        flat
        class="q-ma-md h-150 text-gray-8 dark:text-gray-3"
        no-data-label="No data"
        hide-bottom
        :pagination="{ rowsPerPage: 0 }"
        :rows="props.machineConstants"
        :columns="[
          { name: 'paramString', label: t('machineConstants.columns.paramString'), field: 'paramString', align: 'left' },
          { name: 'currentValue', label: t('machineConstants.columns.currentValue'), field: 'currentValue', align: 'left' },
        ]"
      />

      <QCardActions align="right" class="bg-gray-1 dark:bg-dark-4">
        <QBtn
          v-close-popup
          class="bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('machineConstants.buttons.cancel')"
          flat
          @click="onDialogCancel"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
