<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { t } = useI18n()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const settingsStore = userSettingsStore()
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="w-120">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('axisesVisibilityDialog._') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          class="color-gray-6"
          flat
          round
          dense
        />
      </q-card-section>

      <q-card-section class="pt-0">
        <div class="text-h8 w-100 color-gray-6">
          {{ t('axisesVisibilityDialog.description') }}
        </div>
      </q-card-section>

      <q-card-section class="pt-0">
        <div class="max-h-100 w-full overflow-y-scroll">
          <div
            v-for="[key, axis] in settingsStore.axises.entries()"
            :key="`erp-${key}-selection`"
          >
            <div
              v-if="key !== '\'C'"
              class="text-sm cursor-pointer border rounded mb-2 p-2 flex items-center"
              @click="setAxisVisibility(key, !axis.visible)"
            >
              <q-checkbox
                :model-value="axis.visible"
                :label="`${axis.unit === 'undef' ? t('undef') : axis.unit} ${axis.name}`"
                dense
                size="sm"
                @update:model-value="setAxisVisibility(key, !axis.visible)"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          :label="t('close')"
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-2"
          flat
          @click="onDialogCancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
  .q-dialog__inner--minimized > div {
  max-width: none;
}
</style>
