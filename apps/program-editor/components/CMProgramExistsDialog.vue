<script setup lang="ts">
import type { ProgramTableRow } from '~/shared/types'

const props = defineProps<{
  program: ProgramTableRow
  showBulkActions?: boolean
}>()

const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <QDialog ref="dialogRef" class="select-none">
    <QCard>
      <!-- Başlık -->
      <QCardSection>
        <div class="text-h6 flex items-center">
          {{ t('programExist.title') }}
          <QSpace />
          <QBtn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="() => onDialogOK('noToAll')"
          />
        </div>
      </QCardSection>

      <!-- İçerik -->
      <QCardSection class="text-gray-8 dark:text-gray-3">
        <span class="max-w-100">{{ t('programExist.message', { programNo: props.program.programNo }) }}</span>
      </QCardSection>

      <!-- Aksiyonlar -->
      <QCardActions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <QBtn
          :label="t('no')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          v-if="showBulkActions"
          :label="t('noToAll')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="() => onDialogOK('noToAll')"
        />
        <QBtn
          class="q-mr-sm text-white bg-primary"
          :label="t('yes')"
          flat
          @click="() => onDialogOK('yes')"
        />
        <QBtn
          v-if="showBulkActions"
          class="q-mr-sm text-white bg-primary"
          :label="t('yesToAll')"
          flat
          @click="() => onDialogOK('yesToAll')"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
