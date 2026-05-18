<script setup lang="ts">
import { TeleskopSettingsIds } from '~/shared/constants'

const { t } = useI18n()
const teleskopSettings = useTeleskopSettingsStore()
const tempSettings = ref({ ...teleskopSettings.programCreationSettings }) // Ayarların geçici bir kopyası

const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()

function onDialogOK() {
  teleskopSettings.updateTeleskopSettings(TeleskopSettingsIds.AUTO_SUGGEST_PROGRAM_NO, tempSettings.value.autoSuggestProgramNo)
  onDialogCancel()
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <QCard>
      <!-- Başlık -->
      <QCardSection>
        <div class="text-h6 flex items-center">
          {{ t('createProgramSettings.title') }}
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
            v-model="tempSettings.autoSuggestProgramNo"
            :label="t('createProgramSettings.autoSuggestProgramNo')"
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
