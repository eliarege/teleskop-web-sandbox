<script setup lang="ts">
const props = defineProps<{
  machineId: number
  machineName: string
  machineConstants: { paramString: string, currentValue: string }[]
}>()

const { t } = useI18n()
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <QCard class="w-120">
      <QCardSection>
        <div class="text-h6 flex">
          {{ t('menu.machineConstants') }}
          <q-space />
          <q-btn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
        <div class="text-h8 color-gray-6 dark:text-gray-4">
          {{ t('machineConstants.machineInfo', { machineId: props.machineId, machineName: props.machineName }) }}
        </div>
      </QCardSection>

      <QCardSection>
        <QTable
          flat
          dense
          table-header-style="position: sticky; top: 0; z-index: 1;"
          table-header-class="bg-light-1 dark:bg-dark-6"
          class="h-140 text-gray-8 dark:text-gray-3"
          no-data-label="No data"
          hide-bottom
          :pagination="{ rowsPerPage: 0 }"
          :rows="props.machineConstants"
          :columns="[
            { name: 'paramString', label: t('machineConstants.paramString'), field: 'paramString', align: 'left', sortable: true, headerStyle: 'font-weight: bold' },
            { name: 'currentValue', label: t('machineConstants.currentValue'), field: 'currentValue', align: 'left', sortable: true, headerStyle: 'font-weight: bold' },
          ]"
        />
      </QCardSection>

      <QCardActions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('machineConstants.buttons.cancel')"
          flat
          @click="onDialogCancel"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
