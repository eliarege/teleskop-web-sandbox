<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  unit?: string
  icon: string
  iconColor?: string
  previousValue: number
  currentValue: number
  currentPeriodStart: string
  currentPeriodEnd: string
  previousPeriodStart: string
  previousPeriodEnd: string
  positiveTrendClass?: string
  negativeTrendClass?: string
  formatOptions?: Intl.NumberFormatOptions
}>(), {
  iconColor: '#2281ae',
  positiveTrendClass: 'text-green-500',
  negativeTrendClass: 'text-red-500',
})
const { n, t, d } = useI18n()

function formatNumber(value: number) {
  return `${n(value || 0, {
    style: 'decimal',
    maximumFractionDigits: 0,
    roundingMode: 'halfExpand',
    ...props.formatOptions,
  })} ${props.unit}`
}

function formatDate(dateString: string) {
  if (!dateString)
    return ''
  return d(new Date(dateString), 'date')
}
</script>

<template>
  <div class="lg:(inline) md:(flex-center) <sm:(flex-center)">
    <!-- <div class="inline"> -->
    <QTooltip
      transition-show="scale"
      class="text-black e-border bg-white flex-center flex-col"
      :offset="[3, 3]"
    >
      <span>{{ t('teleskop.consumption-tooltip-last-week', { lastWeekStart: formatDate(previousPeriodStart), lastWeekEnd: formatDate(previousPeriodEnd) }) }}: {{ formatNumber(previousValue) }}</span>
      <span>{{ t('teleskop.consumption-tooltip-this-week', { thisWeekStart: formatDate(currentPeriodStart), thisWeekEnd: formatDate(currentPeriodEnd) }) }}: {{ formatNumber(currentValue) }}</span>
    </QTooltip>
    <TwIcon
      :name="icon"
      :color="iconColor"
      size="40px"
      class="block"
    />
    <span :class="currentValue > previousValue ? negativeTrendClass : positiveTrendClass">
      {{ formatNumber(currentValue) }}
    </span>
  </div>
</template>
