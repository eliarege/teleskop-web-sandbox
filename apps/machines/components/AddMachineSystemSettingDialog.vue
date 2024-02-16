<script setup lang="ts">
import { FormKitSchema } from '@formkit/vue'

const props = defineProps<{
  show: boolean
  settings: []
  tokens: []
}>()

const emit = defineEmits(['close', 'add'])

const { t } = useI18n()

const selectedSetting = ref()
const option = ref()

const options = [
  { label: 'active', value: 'active' },
  { label: 'passive', value: 'passive' },
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
    <q-card>
      <q-card-section>
        <h3>Select the system settting that will be updated on machine</h3>

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
        <div class="flex flex-row gap-4 justify-end">
          <q-btn :label="t('cancel')" @click="$emit('close')" />
          <q-btn :label="t('add')" @click="handleAdd" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
