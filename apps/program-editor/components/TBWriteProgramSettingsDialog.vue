<script setup lang="ts">
import { programWriteSettings } from '~/composables/utils'

const { t } = useI18n()
const { dialogRef, onDialogCancel, onDialogOK } = useDialogPluginComponent()
</script>

<template>
  <QDialog ref="dialogRef" class="select-none">
    <QCard>
      <!-- Başlık -->
      <QCardSection>
        <div class="text-h6 flex items-center">
          {{ t('writeProgramSettings.title') }}
          <QSpace />
          <QBtn
            icon="close"
            class="text-gray-4 dark:text-gray-6"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
      </QCardSection>

      <!-- İçerik -->
      <QCardSection class="text-gray-8 dark:text-gray-3">
        <div class="text-sm mb-2 flex flex-col gap-4">
          <QToggle
            v-model="programWriteSettings.addParallelCommandsFromPreviousStep"
            :label="t('writeProgramSettings.addParallelCommandsFromPreviousStep')"
          />
          <QToggle
            v-model="programWriteSettings.confirmAddParallelCommandToSteps"
            :label="t('writeProgramSettings.confirmAddParallelCommandToSteps')"
          />
          <QToggle
            v-model="programWriteSettings.removeParallelCommandFromOtherSteps"
            :label="t('writeProgramSettings.removeParallelCommandFromOtherSteps')"
          />
          <QToggle
            v-model="programWriteSettings.changeParallelCommandParameterInOtherSteps"
            :label="t('writeProgramSettings.changeParallelCommandParameterInOtherSteps')"
          />
          <QCheckbox
            v-model="programWriteSettings.preventParallelUsageForDisabledCommands"
            :label="t('writeProgramSettings.preventParallelUsageForDisabledCommands')"
          />
          <QCheckbox
            v-model="programWriteSettings.activeCommandGroups"
            :label="t('writeProgramSettings.activeCommandGroups')"
          />
        </div>
      </QCardSection>

      <!-- Aksiyonlar -->
      <QCardActions
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
        align="right"
      >
        <QBtn
          :label="t('cancel')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
        <QBtn
          :label="t('apply')"
          class="q-mr-sm bg-primary text-white"
          flat
          @click="onDialogOK"
        />
      </QCardActions>
    </QCard>
  </QDialog>
</template>
