<script setup lang="ts">
import { deviceSettings } from '~/shared/constants'

defineEmits([...useDialogPluginComponent.emits])
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()

const selectedSetting = ref<string | undefined>()
const selectedState = ref<'active' | 'passive'>('passive')

const settingStates = [
  { label: t('active'), value: 'active' },
  { label: t('passive'), value: 'passive' },
]

function confirmSelection() {
  if (!selectedSetting.value)
    return
  onDialogOK({
    name: selectedSetting.value,
    isActive: selectedState.value === 'active',
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card class="min-w-[600px] select-none">
      <q-card-section>
        <div class="text-h6">
          {{ t('selectSettingToUpdate') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-select
          v-model="selectedSetting"
          :options="deviceSettings"
          :display-value="`${selectedSetting ? t(`updateMachineSettings.setting.${selectedSetting}`) : ''}`"
          outlined
          dense
          options-dense
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ t(`updateMachineSettings.setting.${scope.opt}`) }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-option-group
          v-model="selectedState"
          :options="settingStates"
          type="radio"
          class="mt-2"
        />
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn :label="t('cancel')" @click="onDialogCancel" />
        <q-btn
          :label="t('add')"
          color="primary"
          :disable="!selectedSetting"
          @click="confirmSelection"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
