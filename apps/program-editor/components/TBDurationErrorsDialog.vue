<script setup lang="ts">
defineProps<{
  machine: {
    id: string
    name: string
  }
  errors: string[][]
}>()

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
  >
    <q-card class="w-100">
      <q-card-section>
        <div class="text-h6 flex">
          {{ t('contextBar.durationErrorsTitle') }}
          <q-space />
          <QBtn
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
            @click="onDialogCancel"
          />
        </div>
        <div class="text-h8 text-gray-6 dark:text-gray-4">
          {{ machine.id }} - {{ machine.name }}
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="max-h-100 overflow-y-auto q-pa-sm">
          <div v-if="errors.length === 0">
            {{ t('contextBar.noDurationErrors') }}
          </div>
          <div v-else>
            <div
              v-for="(error, index) in errors"
              :key="index"
              class="q-mb-sm"
            >
              • {{ t(`calculationErrors.${error[0]}`) }}.
              {{ t('commandNo') }}: {{ error[1] }}.
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <QBtn
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('menu.close')"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
