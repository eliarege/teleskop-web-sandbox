<script setup lang="ts">
const props = defineProps({
  dispenserConnectionStatuses: {
    type: Array<any>,
    required: true,
  },
})
const isServiceClosed = computed(() => {
  return !props.dispenserConnectionStatuses.some(disp => disp.connectionStatus !== 3)
})
const { t } = useI18n()

const dispenserStatusBarRef = ref()
const contentWrapper = ref()

onMounted(() => {
  checkForOverflow()
  window.addEventListener('resize', checkForOverflow)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkForOverflow)
})

function checkForOverflow() {
  const container = dispenserStatusBarRef.value
  const content = contentWrapper.value

  if (content.scrollWidth > container.clientWidth) {
    container.classList.add('overflow')
  } else {
    container.classList.remove('overflow')
  }
}
</script>

<template>
  <div ref="dispenserStatusBarRef" class="dispenser-status">
    <div ref="contentWrapper" class="content-wrapper">
      <div v-if="isServiceClosed">
        Service closed
      </div>
      <div
        v-for="dispenser in dispenserConnectionStatuses"
        v-else
        :key="dispenser.dispNo"
        class="ml-10 font-size-4"
      >
        <router-link :to="`/vnc/${dispenser.dispNo}`" target="_blank">
          <span class="cursor-pointer hover:decoration-underline">
            {{ `${dispenser.dispNo} - ${dispenser.name} - ${t(`dispenserConnectionStatus.${dispenser.connectionStatus}`)}` }}
            <q-icon
              v-bind="getConnectionStatusIcon(dispenser.connectionStatus)"
              size="sm"
            />
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dispenser-status {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 3rem; /* Adjust the height as needed */
  overflow-x: hidden;
  overflow-y: hidden;
  white-space: nowrap;
  background-color: #f0f0f0; /* Set a background color if needed */
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1); /* Optional shadow for visual effect */
}

.content-wrapper {
  display: inline-flex;
  align-items: center;
  height: 100%;
  will-change: transform;
}

.dispenser-status.overflow .content-wrapper {
  animation: swipe 30s linear infinite;
}

.dispenser-status.overflow:hover .content-wrapper {
  animation-play-state: paused;
}

@keyframes swipe {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100% + 100vw));
  }
}
</style>
