<script setup lang="ts">
import { removeAllCheckboxOnOptionGroup, reverseAllCheckboxOnOptionGroup, selectAllCheckboxOnOptionGroup } from '../shared/functions'
import type { MachineGroup, MachineInfo } from '~/shared/types'

const props = defineProps<{
  model: MachineInfo[] | undefined
  options: MachineInfo[] | undefined
}>()

const emit = defineEmits(['update:model'])
const { t } = useI18n()

const buttons = [
  {
    icon: 'check',
    tooltip: t('selectAll'),
    onClick: () => {
      if (props.options)
        emit('update:model', selectAllCheckboxOnOptionGroup(props.options))
    },
  },
  {
    icon: 'remove',
    tooltip: t('dropAll'),
    onClick: () =>
      emit('update:model', removeAllCheckboxOnOptionGroup()),
  },
  {
    icon: 'sync_alt',
    tooltip: t('selectReverse'),
    onClick: () => {
      if (props.options && props.model)
        emit('update:model', reverseAllCheckboxOnOptionGroup(props.options, props.model))
    },
  },
]
</script>

<template>
  <div>
    <QBtn
      v-for="(button, index) in buttons"
      :key="index"
      dense
      flat
      @click="button.onClick()"
    >
      <QIcon :name="button.icon" size="xs" />
      <QTooltip> {{ button.tooltip }}</QTooltip>
    </QBtn>
  </div>
</template>
