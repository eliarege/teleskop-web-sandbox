<script lang="ts" setup>
import { arc, interpolateRdYlGn, pie } from 'd3'
import { clamp, times } from 'lodash-es'
import anime from 'animejs'

const props = defineProps<{
  modelValue: number
  arcCount: number
  maxValue: number
  minAngle: number
  maxAngle: number
  padAngle: number
  minDuration: number
  maxDuration: number
  innerRadius: number
  outerRadius: number
  needleColor: string
}>()

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
useVModel(props, 'modelValue', emit)

const viewBox = { width: 50, height: 50 }
const minValue = 0
const needleRadius = (15 * viewBox.width) / 500
const needleCenter = { x: 0, y: -needleRadius / 2 }

const arcGen = arc().cornerRadius(1)

const pieGen = pie()
  .startAngle(props.minAngle)
  .endAngle(props.maxAngle)
  .padAngle(props.padAngle)
  .sort(null)

const pieArcData = pieGen(Array(props.arcCount).fill(1))

const pieArcs = pieArcData.map(
  datum =>
    arcGen({
      ...datum,
      innerRadius: props.innerRadius,
      outerRadius: props.outerRadius,
    })!,
)

const pieArcColors = times(props.arcCount, i =>
  interpolateRdYlGn(i / props.arcCount)).reverse()
const theta = ref(calculateTheta(props.modelValue))

watch(
  () => props.modelValue,
  (nextValue, prevValue) => {
    const nextTheta = calculateTheta(nextValue)
    const duration
      = (Math.abs(
        clamp(nextValue, minValue, props.maxValue)
        - clamp(prevValue, minValue, props.maxValue),
      )
      / (props.maxValue - minValue))
      * (props.maxDuration - props.minDuration)
      + props.minDuration
    anime({
      targets: theta,
      value: nextTheta,
      easing: 'easeOutElastic(1, .6)',
      duration,
      loop: false,
    })
  },
)

function calculateTheta(value: number) {
  return (
    clamp((value - minValue) / (props.maxValue - minValue), 0, 1) // ratio
    * (props.maxAngle - props.minAngle)
    + props.minAngle // angle
    + Math.PI / 2
  ) // offset
}

const needlePath = computed(
  () =>
    `M ${
      // Top Point
      needleCenter.x - props.outerRadius * 0.55 * Math.cos(theta.value)
    } ${needleCenter.y - props.outerRadius * 0.55 * Math.sin(theta.value)} L ${
      // Left Point
      needleCenter.x - needleRadius * Math.cos(theta.value - Math.PI / 2)
    } ${
      needleCenter.y - needleRadius * Math.sin(theta.value - Math.PI / 2)
    } L ${
      // Right Point
      needleCenter.x - needleRadius * Math.cos(theta.value + Math.PI / 2)
    } ${needleCenter.y - needleRadius * Math.sin(theta.value + Math.PI / 2)}`,
)
</script>

<template>
  <svg
    :viewBox="`${viewBox.width / -2} ${viewBox.height / -2} ${viewBox.width} ${
      viewBox.height
    }`"
  >
    <path
      v-for="i in arcCount"
      :key="i"
      :d="pieArcs[i - 1]"
      :fill="pieArcColors[i - 1]"
    />
    <circle
      :cx="needleCenter.x"
      :cy="needleCenter.y"
      :r="needleRadius"
      :fill="props.needleColor"
    />
    <path :d="needlePath" :fill="props.needleColor" />
    <text
      text-anchor="middle"
      :dy="needleCenter.y + 15"
      class="text-sm"
      fill="rgb(0, 0, 0)"
    >
      {{ Math.round(props.modelValue) }}
    </text>
    <text
      text-anchor="middle"
      y="20"
      class="text"
    >
      {{ t("details.temp") }}
    </text>
  </svg>
</template>

<style scoped lang="postcss">
svg {
  @apply m-auto w-full h-full;
}
.text {
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
  font-size: 5px;
  fill: rgb(0, 0, 0);
}
@media screen and (max-width: 735px) {
  svg {
    @apply w-1/2 h-1/2;
  }
}
</style>
