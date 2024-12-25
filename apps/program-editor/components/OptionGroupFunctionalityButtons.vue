<script setup lang="ts">
const props = defineProps<{
  modelValue?: any[]
  options?: any[]
}>()

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const buttons = [
  {
    icon: 'check',
    tooltip: t('selectAll'),
    onClick: () => {
      if (props.options)
        emit('update:modelValue', [...props.options])
    },
  },
  {
    icon: 'remove',
    tooltip: t('dropAll'),
    onClick: () =>
      emit('update:modelValue', []),
  },
  {
    icon: 'sync_alt',
    tooltip: t('selectReverse'),
    onClick: () => {
      if (props.options && props.modelValue)
        emit('update:modelValue', props.options.filter(opt => !props.modelValue!.includes(opt)))
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
