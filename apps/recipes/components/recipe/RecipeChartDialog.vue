<script setup lang="ts">
import { Line } from 'vue-chartjs'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import type { RecipeMasterStep } from '~/shared/types'

const props = defineProps({
  recipeId: {
    type: Number,
    required: true,
  },
  recipeName: {
    type: String,
    required: true,
  },
})

interface Point {
  x: number
  y: number
}

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, ChartDataLabels)

const { t } = useI18n()
const { dialogRef, onDialogHide } = useDialogPluginComponent()
defineEmits([...useDialogPluginComponent.emits])

const programs = ref<RecipeMasterStep[]>([])

getPrograms()

const materials = [
  { materialCode: 'M001', materialName: 'Material 1', time: 15000 },
  { materialCode: 'K001', materialName: 'Chemical 1', time: 20000 },
  { materialCode: 'M002', materialName: 'Material 2', time: 25000 },
  { materialCode: 'M003', materialName: 'Material 3', time: 35000 },
]

async function getPrograms() {
  programs.value = await $fetch(`/api/recipes/master/steps/${props.recipeId}`)
}

function getAllMaterialsFromSteps(program: RecipeMasterStep) {
  return program.steps.flatMap(step => step.materials)
}

const columns = [
  { name: 'materialCode', label: t('materialFields.Code'), align: 'left', field: 'materialCode' },
  { name: 'materialName', label: t('materialFields.Name'), align: 'left', field: 'materialName' },
  { name: 'amount', label: t('Amount'), align: 'right', field: 'amount' },
  { name: 'unit', label: t('Unit'), align: 'left', field: 'unit' },
]

const initialData = [
  { x: 10, y: 30 },
  { x: 20, y: 90 },
  { x: 20, y: 20 },
  { x: 30, y: 40 },
  { x: 40, y: 80 },
]

function calculateY(x: number, point1: Point, point2: Point) {
  const { x: x1, y: y1 } = point1
  const { x: x2, y: y2 } = point2
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)
}

const mergedData = [...initialData]

materials.forEach((material) => {
  const timeInSeconds = material.time / 1000
  const existingDataPoint = mergedData.find(dataPoint => dataPoint.x === timeInSeconds)

  if (!existingDataPoint) {
    const beforePoint = mergedData
      .filter(dataPoint => dataPoint.x < timeInSeconds)
      .reduce((prev, curr) => (curr.x > prev.x ? curr : prev), { x: Number.NEGATIVE_INFINITY, y: 0 })

    const afterPoint = mergedData
      .filter(dataPoint => dataPoint.x > timeInSeconds)
      .reduce((prev, curr) => (curr.x < prev.x ? curr : prev), { x: Number.POSITIVE_INFINITY, y: 0 })

    if (beforePoint.x !== Number.NEGATIVE_INFINITY && afterPoint.x !== Number.POSITIVE_INFINITY) {
      const interpolatedY = calculateY(timeInSeconds, beforePoint, afterPoint)
      mergedData.push({ x: timeInSeconds, y: interpolatedY })
    }
  }
})

mergedData.sort((a, b) => a.x - b.x)

const chartData = {
  datasets: [
    {
      label: t('recipeFields.Temperature'),
      data: mergedData,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      showLine: true,
    },
  ],
}

const chartOptions = {
  responsive: true,
  plugins: {
    datalabels: {
      display: (context: any) => {
        const currentX = context.dataset.data[context.dataIndex].x
        const firstOccurrenceIndex = context.dataset.data.findIndex((dataPoint: any) => dataPoint.x === currentX)
        const isFirstOccurrence = context.dataIndex === firstOccurrenceIndex
        const materialMatch = materials.find(material => material.time / 1000 === currentX)
        // Display the label only if it is the first occurrence of the x value and has a material match
        return isFirstOccurrence && !!materialMatch
      },
      align: 'top',
      formatter: (value: any) => {
        const matchedMaterial = materials.find(material => material.time / 1000 === value.x)
        return matchedMaterial ? matchedMaterial.materialName : ''
      },
      font: {
        size: 10,
      },
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
      borderRadius: 4,
      color: 'white',
      padding: 4,
    },
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: props.recipeName,
    },
  },
  scales: {
    x: {
      type: 'linear',
      title: {
        display: true,
        text: t('Minutes'),
      },
    },
    y: {
      title: {
        display: true,
        text: `${t('recipeFields.Temperature')}(°C)`,
      },
      suggestedMin: 0,
      suggestedMax: 100,
    },
  },
}
</script>

<template>
  <QDialog
    ref="dialogRef"
    full-height
    full-width
    @hide="onDialogHide"
  >
    <QCard>
      <Line :data="chartData" :options="chartOptions" />
      <div
        v-for="program in programs"
        :key="program.programNo"
        m-10
        w-300
      >
        <h3 flex-center>
          {{ program.programName }}
        </h3>
        <QTable
          :rows="getAllMaterialsFromSteps(program)"
          hide-bottom
          flex-center
          :columns
        >
          <template #body="props">
            <QTr>
              <QTd
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <span v-if="col.field === 'unit'">
                  {{ t(`units.${props.row.unit}`) }}
                </span>
                <span v-else>
                  {{ props.row[col.field] }}
                </span>
              </QTd>
            </QTr>
          </template>
        </QTable>
      </div>
    </QCard>
  </QDialog>
</template>
