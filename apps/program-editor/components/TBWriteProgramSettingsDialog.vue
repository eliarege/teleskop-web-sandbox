<script setup lang="ts">
import { ref } from 'vue'
import { useProgramWriteSettings } from '~/composables/settings'

const { t } = useI18n()
const settings = useProgramWriteSettings()
const tempSettings = ref({ ...settings.value }) // Ayarların geçici bir kopyası

const { dialogRef, onDialogCancel } = useDialogPluginComponent()

function onDialogOK() {
  settings.value = tempSettings.value
  onDialogCancel()
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogCancel"
  >
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
            v-model="tempSettings.addParallelCommandsFromPreviousStep"
            :label="t('writeProgramSettings.addParallelCommandsFromPreviousStep')"
          />
          <QToggle
            v-model="tempSettings.confirmAddParallelCommandToSteps"
            :label="t('writeProgramSettings.confirmAddParallelCommandToSteps')"
          />
          <QToggle
            v-model="tempSettings.removeParallelCommandFromOtherSteps"
            :label="t('writeProgramSettings.removeParallelCommandFromOtherSteps')"
          />
          <!-- <QToggle
            v-model="tempSettings.changeParallelCommandParameterInOtherSteps"
            :label="t('writeProgramSettings.changeParallelCommandParameterInOtherSteps')"
          /> -->
          <QCheckbox
            v-model="tempSettings.preventParallelUsageForDisabledCommands"
            :label="t('writeProgramSettings.preventParallelUsageForDisabledCommands')"
          />
          <QCheckbox
            v-model="tempSettings.activeCommandGroups"
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
