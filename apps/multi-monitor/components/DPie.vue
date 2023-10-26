<script setup lang="ts">
import { arc, pie } from 'd3'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  color: string[]
  cornerRadius: number
  pieData: number[]
  startAngle: number
  endAngle: number
  padAngle: number
  innerRadius: number
  outerRadius: number
  width: number
  height: number
}>()
const { t } = useI18n()
const viewBox = ref({ width: 25, height: 25 })
const arcGen = arc().cornerRadius(props.cornerRadius)
const pieGen = pie()
  .startAngle(props.startAngle)
  .endAngle(props.endAngle)
  .padAngle(props.padAngle)
const pieArcData = computed(() => pieGen(props.pieData))
const pieArcs = computed(() =>
  pieArcData.value.map(
    datum =>
      arcGen({
        ...datum,
        innerRadius: props.innerRadius,
        outerRadius: props.outerRadius,
      })!,
  ),
)
</script>

<template>
  <svg
    class="sm:(h-1/3) md:(h-full) w-full max-w-15 h-15 min-h-10"
    :viewBox="`
      ${viewBox.width / -2}
      ${viewBox.height / -2}
      ${viewBox.width}
      ${viewBox.height}
    `"
  >
    <g class="path-group">
      <path
        v-for="(item, idx) in pieData.length"
        :key="idx"
        class="element"
        :d="pieArcs[item - 1]"
        :fill="color[item - 1]"
      >
        <title>
          {{ pieArcData[item - 1].data }}
        </title>
      </path>
    </g>
  </svg>
</template>

<style scoped lang="postcss">
g:hover > :not(:hover) {
  transition: 0.4s;
  opacity: 0.4 !important;
}
</style>
