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
const { n, t } = useI18n()
function formatNumber(value: number) {
  return `${n(value || 0, {
    style: 'decimal',
    maximumFractionDigits: 0,
    roundingMode: 'halfExpand',
    ...props.formatOptions,
  })} ${props.unit}`
}
const lastWeek = computed(() => {
  const start = new Date()
  start.setDate(start.getDate() - start.getDay() - 7)
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setDate(end.getDate() - end.getDay() - 1)
  end.setHours(23, 59, 59, 999)
  return { start, end }
})
const thisWeek = computed(() => {
  const start = new Date()
  start.setDate(start.getDate() - start.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setDate(end.getDate() - end.getDay() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
})
</script>

<template>
  <div class="lg:(inline) md:(flex-center) <sm:(flex-center)">
    <!-- <div class="inline"> -->
    <QTooltip
      transition-show="scale"
      class="text-black e-border bg-white flex-center flex-col"
      :offset="[3, 3]"
    >
      <span>{{ t('teleskop.consumption-tooltip-last-week', { lastWeekStart: lastWeek.start.toLocaleDateString(), lastWeekEnd: lastWeek.end.toLocaleDateString() }) }}: {{ formatNumber(previousValue) }}</span>
      <span>{{ t('teleskop.consumption-tooltip-this-week', { thisWeekStart: thisWeek.start.toLocaleDateString(), thisWeekEnd: thisWeek.end.toLocaleDateString() }) }}: {{ formatNumber(currentValue) }}</span>
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
