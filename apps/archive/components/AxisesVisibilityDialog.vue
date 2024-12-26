<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const settingsStore = userSettingsStore()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
  >
    <q-card>
      <q-card-section>
        <div>
          <div class="text-2xl">
            {{ t('axisesVisibilityDialog._') }}
          </div>
          <div class="text-lg whitespace-normal mt-5 w-140">
            {{ t('axisesVisibilityDialog.description') }}
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="max-h-100 w-full overflow-y-scroll">
          <div
            v-for="[key, axis] in settingsStore.axises.entries()"
            :key="`erp-${key}-selection`"
          >
            <div
              v-if="key !== '\'C'"
              class="mb-1 text-xl cursor-pointer w-full h-full"
              @click="setAxisVisibility(key, !axis.visible)"
            >
              <q-checkbox
                v-model="axis.visible"
                :label="`${axis.unit === 'undef' ? t('undef') : axis.unit} ${axis.name || ''}`"
                dense
                class="my-3 ml-5"
              />
              <q-separator />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-close-popup
          :label="t('close')"
          outline
          color="black"
          icon="close"
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
