<script setup lang="ts">
import { FormKitSchema } from '@formkit/vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const { t } = useI18n()

const option = ref()

const options = [
  { label: 'active', value: 'active' },
  { label: 'passive', value: 'passive' },
]

function handleAdd() {
  console.log('add')
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
