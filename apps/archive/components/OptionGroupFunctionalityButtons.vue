<script setup lang="ts">
import { removeAllCheckboxOnOptionGroup, reverseAllCheckboxOnOptionGroup, selectAllCheckboxOnOptionGroup } from '../shared/functions'

const props = defineProps({
  model: [],
  options: Array<{ value: any }>,
})
const emit = defineEmits(['update:model'])
const { t } = useI18n()
const buttons = [
  { icon: 'check', tooltip: t('selectAll'), onClick: () => emit('update:model', selectAllCheckboxOnOptionGroup(props.options!)) },
  { icon: 'remove', tooltip: t('dropAll'), onClick: () => emit('update:model', removeAllCheckboxOnOptionGroup()) },
  { icon: 'sync_alt', tooltip: t('selectReverse'), onClick: () => emit('update:model', reverseAllCheckboxOnOptionGroup(props.options!, props.model!)) },
]
</script>

<template>
  <div>
    <q-btn
      v-for="(button, index) in buttons"
      :key="index"
      dense
      flat
      @click="button.onClick()"
    >
      <q-icon :name="button.icon" size="xs" />
      <q-tooltip> {{ t('selectAll') }}</q-tooltip>
    </q-btn>
  </div>
</template>
