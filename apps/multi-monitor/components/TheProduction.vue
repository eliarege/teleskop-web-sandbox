<script setup lang="ts">
import type { PropType } from 'vue'
import type { MachineData } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

defineProps({
  formatted: String,
  machineData: {
    type: Array as PropType<MachineData[]>,
    required: true,
  },
})

const container = ref<HTMLElement>()
const data = useDataStore()
const { y, arrivedState } = useScroll(container)
const scrollAnimationActive = ref(false)

let abortAnimation: () => void = () => {}

function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function startAnimation() {
  let enabled = true
  let direction = 1
  let frame = 0
  const animate = async () => {
    frame++
    if (frame >= data.scrollSpeedProps.frame) {
      frame = 0
      y.value += direction * data.scrollSpeedProps.speed
      if (direction > 0 && arrivedState.bottom) {
        direction = -1
        await wait(data.scrollSpeedProps.delay)
      } else if (direction < 0 && arrivedState.top) {
        direction = 1
        await wait(data.scrollSpeedProps.delay)
      }
    }
    if (enabled) {
      requestAnimationFrame(animate)
    }
  }
  animate()
  return () => {
    enabled = false
  }
}

watch(scrollAnimationActive, (enabled) => {
  if (enabled) {
    abortAnimation = startAnimation()
  } else {
    abortAnimation()
  }
})

onScopeDispose(() => {
  abortAnimation()
})

// ctrl_p to activate presentation mode
onKeyStroke(['P', 'p'], (ev) => {
  if (ev.ctrlKey) {
    ev.preventDefault()
    scrollAnimationActive.value = !scrollAnimationActive.value
  }
})
</script>

<template>
  <ElBacktop />
  <TeleskopNavbar :formatted="formatted" :machine-data="machineData" />
  <div
    ref="container"
    class="main-container"
  >
    <MachineCardMain :machine-data="machineData" />
  </div>
  <Teleport to="body">
    <div
      v-if="scrollAnimationActive"
      class="absolute inset-0 z-100"
      @click="scrollAnimationActive = false"
    />
  </Teleport>
</template>

<style lang="postcss" scoped>
@media screen and (min-width: 735px) {
  .main-container {
    padding: 0 0.5rem;
    width: 100%;
    height: calc(100vh - 5rem);
    overflow: auto;
  }
}
</style>
