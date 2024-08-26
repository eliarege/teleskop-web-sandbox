<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  unit?: string
  icon: string
  iconColor?: string
  previousValue: number
  currentValue: number
  positiveTrendClass?: string
  negativeTrendClass?: string
  formatOptions?: Intl.NumberFormatOptions
}>(), {
  iconColor: '#2281ae',
  positiveTrendClass: 'text-green-500',
  negativeTrendClass: 'text-red-500',
})
const { n } = useI18n()

function formatNumber(value: number) {
  return `${n(value || 0, {
    style: 'decimal',
    maximumFractionDigits: 0,
    roundingMode: 'halfExpand',
    ...props.formatOptions,
  })} ${props.unit}`
}
</script>

<template>
  <div class="lg:(inline) md:(flex-center) <sm:(flex-center)">
    <!-- <div class="inline"> -->
    <QTooltip
      transition-show="scale"
      class="text-black e-border bg-white"
      :offset="[3, 3]"
    >
      {{ label }}
      {{ formatNumber(previousValue) }}
    </QTooltip>
    <Icon
      :name="icon"
      :color="iconColor"
      size="40"
      class="block"
    />
    <span :class="currentValue > previousValue ? negativeTrendClass : positiveTrendClass">
      {{ formatNumber(currentValue) }}
    </span>
  </div>
</template>
