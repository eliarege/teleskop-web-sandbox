<script setup lang="ts">
import type { Setting } from '~/types'

const props = defineProps<{
  show: boolean
  settings: Setting[]
  tokens: Record<string, string>
}>()

const emit = defineEmits(['close', 'add'])

const { t } = useI18n()

const selectedSetting = ref<Setting | undefined>()
const option = ref<'active' | 'passive'>('passive')

const {
  hasChanges,
  confirmVisible,
  requestClose,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard({
  getState: () => ({
    selectedSetting: selectedSetting.value,
    option: option.value,
  }),
  setState: (state) => {
    selectedSetting.value = state?.selectedSetting
    option.value = (state?.option as typeof option.value) ?? 'passive'
  },
  isOpen: () => props.show,
})

const options = [
  { label: t('active'), value: 'active' },
  { label: t('passive'), value: 'passive' },
]

function handleAdd() {
  if (!selectedSetting.value)
    return
  emit('add', { ...selectedSetting.value, isActive: option.value === 'active' })
  markSaved()
}

function handleCancel() {
  requestClose(() => emit('close'))
}
</script>

<template>
  <q-dialog
    :model-value="show"
    :persistent="hasChanges"
    @hide="$emit('close')"
  >
    <q-card class="min-w-[1000px]">
      <q-card-section>
        <h3>{{ t('selectSettingToUpdate') }}</h3>
        <q-select
          v-model="selectedSetting"
          :options="props.settings"
          :display-value="`${selectedSetting ? t(`updateMachineSettings.${selectedSetting.caption}`) : ''}`"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ t(`updateMachineSettings.${scope.opt.caption}`) }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <q-option-group
          v-model="option"
          :options="options"
          type="radio"
        />
        <q-card-actions align="right">
          <q-btn :label="t('cancel')" @click="handleCancel" />
          <q-btn
            :label="t('add')"
            color="primary"
            :disable="!selectedSetting"
            @click="handleAdd"
          />
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>

  <ConfirmDialog
    v-model="confirmVisible"
    :title="t('unsavedChanges.title')"
    :message="t('unsavedChanges.message')"
    :cancel-label="t('unsavedChanges.continue')"
    :confirm-label="t('unsavedChanges.discard')"
    confirm-color="negative"
    @confirm="confirmDiscard"
    @cancel="keepEditing"
  />
</template>
