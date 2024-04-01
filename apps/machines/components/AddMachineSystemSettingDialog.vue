<script setup lang="ts">
const props = defineProps<{
  show: boolean
  settings: []
  tokens: []
}>()

const emit = defineEmits(['close', 'add'])

const { t } = useI18n()

const selectedSetting = ref()
const option = ref('passive')

const options = [
  { label: t('active'), value: 'active' },
  { label: t('passive'), value: 'passive' },
]

function handleAdd() {
  emit('add', { ...selectedSetting.value, isActive: option.value === 'active' })
}
</script>

<template>
  <q-dialog
    :model-value="show"
    @hide="$emit('close')"
  >
    <q-card class="min-w-[1000px]">
      <q-card-section>
        <h3>{{ t('selectSettingToUpdate') }}</h3>
        <q-select
          v-model="selectedSetting"
          :options="settings"
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
          <q-btn :label="t('cancel')" @click="$emit('close')" />
          <q-btn :label="t('add')" color="primary" @click="handleAdd" />
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
