<script setup lang="ts">
import { removeAllCheckboxOnOptionGroup, reverseAllCheckboxOnOptionGroup, selectAllCheckboxOnOptionGroup } from '../shared/functions'

const props = defineProps({
  model: [],
  options: Array<{ value: any }>,
})
const emit = defineEmits(['update:model'])

const { t } = useI18n()
</script>

<template>
  <div>
    <q-btn icon="check" dense class="p-2" @click="emit('update:model', selectAllCheckboxOnOptionGroup(props.options!))">
      <q-tooltip> {{ t('selectAll') }}</q-tooltip>
    </q-btn>
    <q-btn icon="remove" dense class="p-2" @click="emit('update:model', removeAllCheckboxOnOptionGroup())">
      <q-tooltip> {{ t('dropAll') }}</q-tooltip>
    </q-btn>
    <q-btn icon="sync_alt" dense class="p-2" @click="emit('update:model', reverseAllCheckboxOnOptionGroup(props.options!, props.model!))">
      <q-tooltip> {{ t('selectReverse') }}</q-tooltip>
    </q-btn>
  </div>
</template>
