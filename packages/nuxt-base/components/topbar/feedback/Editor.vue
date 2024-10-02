<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'

const emit = defineEmits(['close'])
interface Rectangle {
  id: number
  startX: number
  startY: number
  width: number
  height: number
  showCloseButton: boolean
}

const { t } = useI18n()
const image = defineModel('image', { type: String, required: true })
const mergedImage = defineModel('mergedImage', { type: String, required: true })

const rectArr = defineModel<Rectangle[]>('rectArr', { required: true })
const { width, height } = useWindowSize()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const rem = 16
let rectId = (rectArr.value.reduce((maxId, rect) => Math.max(maxId, rect.id), 0)) + 1

function saveScreenshot() {
  const originalCanvas = canvasRef.value
  if (!originalCanvas)
    return

  const newCanvas = document.createElement('canvas')
  newCanvas.width = originalCanvas.width
  newCanvas.height = originalCanvas.height

  const ctx = newCanvas.getContext('2d')!

  const img = new Image()
  img.src = image.value

  img.onload = () => {
    ctx.drawImage(img, 0, 0, newCanvas.width, newCanvas.height)
    ctx.drawImage(originalCanvas, 0, 0)

    mergedImage.value = newCanvas.toDataURL('image/png')
    emit('close')
  }
}

async function drawAllRects(ctx: CanvasRenderingContext2D) {
  await nextTick()
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (rectArr.value.length === 0) {
    return
  }
  ctx.fillStyle = 'rgba(128, 128, 128, 0.5)'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  rectArr.value.forEach((rect: Rectangle) => {
    ctx.clearRect(rect.startX, rect.startY, rect.width, rect.height)

    ctx.strokeStyle = 'yellow'
    ctx.lineWidth = 4
    ctx.strokeRect(rect.startX, rect.startY, rect.width, rect.height)
  })
}

async function handleClose(rectId: number) {
  rectArr.value = rectArr.value.filter((rect: Rectangle) => rect.id !== rectId)
  await nextTick()
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')!
    drawAllRects(ctx)
  }
}

function updateCloseButtonVisibility(x: number, y: number) {
  rectArr.value.forEach(rect => rect.showCloseButton = false)

  for (let i = rectArr.value.length - 1; i >= 0; i--) {
    const rect = rectArr.value[i]
    if (
      x > rect.startX && x < rect.startX + rect.width
      && y > rect.startY && y < rect.startY + rect.height
    ) {
      rect.showCloseButton = true
      break
    }
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D
  drawAllRects(ctx)

  if (!canvas)
    return

  canvas.height = height.value - (rem * 2)
  canvas.width = width.value - (rem * 2)

  let isDrawing = false
  let startX: number
  let startY: number

  function onMouseDown(e: MouseEvent) {
    startX = e.offsetX
    startY = e.offsetY
    isDrawing = true
  }
  function onMouseMove(e: MouseEvent) {
    if (isDrawing) {
      const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D
      const currentX = e.offsetX
      const currentY = e.offsetY

      drawAllRects(ctx)

      const width = currentX - startX
      const height = currentY - startY
      ctx.strokeStyle = 'yellow'
      ctx.lineWidth = 4
      ctx.clearRect(startX, startY, width, height)
      ctx.strokeRect(startX, startY, width, height)
    } else {
      updateCloseButtonVisibility(e.offsetX, e.offsetY)
    }
  }
  function onMouseUp(e: MouseEvent) {
    if (!canvas)
      return

    const currentX = e.offsetX
    const currentY = e.offsetY

    let width = currentX - startX
    let height = currentY - startY

    if (width < 0) {
      startX += width
      width = Math.abs(width)
    }

    if (height < 0) {
      startY += height
      height = Math.abs(height)
    }

    if (width !== 0 && height !== 0) {
      rectArr.value.push({ id: rectId++, startX, startY, width, height, showCloseButton: false })
    }

    isDrawing = false
    drawAllRects(canvas.getContext('2d') as CanvasRenderingContext2D)
  }

  useEventListener(canvas, 'mousedown', onMouseDown)
  useEventListener(canvas, 'mousemove', onMouseMove)
  useEventListener(canvas, 'mouseup', onMouseUp)
})
</script>

<template>
  <div class="w-full flex-center flex-col border-1 border-gray-900 rounded-2xl overflow-hidden">
    <div class="w-full h-15 bg-gray-900 text-white flex-center px-5">
      <span>{{ t('feedback.editor.title') }}</span>
      <q-space />
      <TopbarFeedbackEditorCloseButton
        class="rounded-2xl"
        color="transparent"
        text-color="white"
        @close="$emit('close')"
      />
    </div>
    <div class="relative max-h-75vh overflow-auto select-none">
      <canvas ref="canvasRef" class="absolute left-0 top-0" />
      <img
        class="left-0 top-0"
        :src="image"
        :style="{
          height: `${height - (rem * 2)}px`,
          width: `${width - (rem * 2)}px`,
        }"
      >
      <div
        v-for="rect in rectArr"
        :key="rect.id"
        :style="{ position: 'absolute', left: `${rect.startX + rect.width}px`, top: `${rect.startY}px`, transform: 'translate(-50%, -50%)' }"
      >
        <TopbarFeedbackEditorCloseButton
          v-if="rect.showCloseButton"
          dense
          color="black"
          @close="handleClose(rect.id)"
        />
      </div>
    </div>
    <div class="w-full h-15 bg-gray-900 text-white flex-center">
      <q-space />
      <div class="flex gap-5">
        <q-btn
          color="primary"
          :label="t('feedback.editor.save')"
          class="w-20 whitespace-nowrap"
          @click="saveScreenshot"
        />
        <q-btn
          flat
          color="red"
          :label="t('feedback.editor.cancel')"
          class="w-20 whitespace-nowrap"
          @click="$emit('close')"
        />
      </div>
    </div>
  </div>
</template>
