<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { QBtn, QIcon, QTooltip } from 'quasar'
import { useResizeObserver } from '@vueuse/core'
import type { CustomQBtnProps } from '../composables/useContextBar'
import TBDurationErrorsDialog from './TBDurationErrorsDialog.vue'
import { calculateProgramDuration } from '~/shared/formula'
import type { Machine, Program } from '~/shared/types'

const props = defineProps<{
  machine: Machine
  program: Program

  initialTemperature: number
  contextBarButtons: readonly CustomQBtnProps[]
}>()

const { t } = useI18n()

const leftDrawerOpen = defineModel<boolean>('leftDrawerOpen', { required: true })
const rightDrawerOpen = defineModel<boolean>('rightDrawerOpen', { required: true })

const duration = ref(props.program.duration ?? 0)
const durationErrors = ref<string[][]>([])

const visibleContextBarButtons = computed(() =>
  props.contextBarButtons.filter(btn => btn.visible !== false),
)

function calcProgramDuration() {
  const result = calculateProgramDuration(
    props.program,
    props.machine,
    props.initialTemperature ?? 25,
  )

  duration.value = result.duration
  durationErrors.value = result.errors
}

onMounted(calcProgramDuration)

watch(
  () => props.program.steps,
  calcProgramDuration,
  { deep: true },
)

watch(
  () => props.initialTemperature,
  calcProgramDuration,
)

const container = ref<HTMLElement | null>(null)
const buttons = ref<HTMLElement | null>(null)

const showLabels = ref(true)
let openButtonWidth = 0

useResizeObserver(container, () => {
  if (!container.value || !buttons.value)
    return

  if (showLabels.value)
    openButtonWidth = buttons.value.scrollWidth

  showLabels.value = openButtonWidth < container.value.clientWidth
})
</script>

<template>
  <div class="flex w-full items-center justify-between">
    <!-- LEFT SIDE -->
    <div class="flex flex-1 items-center">
      <!-- Left Drawer Button -->
      <QBtn
        class="text-gray-6 dark:text-gray-3"
        icon="menu"
        square
        flat
        @click="leftDrawerOpen = !leftDrawerOpen"
      />

      <!-- Button Container -->
      <div
        ref="container"
        class="flex flex-1 items-center overflow-hidden"
      >
        <div
          ref="buttons"
          class="flex items-center whitespace-nowrap"
        >
          <!-- Context Buttons -->
          <QBtn
            v-for="button in visibleContextBarButtons"
            :key="button.label || button.originalLabel"
            :disable="button.disable"
            :icon="button.icon"
            :label="showLabels ? button.label : undefined"
            :class="showLabels ? 'mx-0 px-2 ml-1' : 'mx-1 px-4'"
            square
            flat
            @click="button.onClick"
          >
            <QTooltip
              v-if="button.tooltip || button.shortcut"
            >
              {{ button.tooltip }}
              <span v-if="button.shortcut">
                ({{ button.shortcut }})
              </span>
            </QTooltip>
          </QBtn>
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="flex items-center justify-end">
      <div
        v-if="props.program.programNo"
        class="flex items-center px-2"
      >
        <QIcon
          v-if="durationErrors.length > 0"
          name="warning"
          color="warning"
          class="mr-2 cursor-pointer"
          @click="$q.dialog({
            component: TBDurationErrorsDialog,
            componentProps: {
              machine: props.machine,
              errors: durationErrors,
            },
          })"
        >
          <QTooltip>
            {{ t('contextBar.durationErrorsTooltip') }}
          </QTooltip>
        </QIcon>

        {{ formatDuration(duration) }}
      </div>

      <!-- Right Drawer Button -->
      <QBtn
        class="text-gray-6 dark:text-gray-3"
        icon="menu"
        square
        flat
        @click="rightDrawerOpen = !rightDrawerOpen"
      />
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.q-btn {
  @apply text-transform: capitalize;
  @apply color-gray-7 dark:color-gray-3;
  font-size: 14px !important;
}

:deep(.q-btn .q-icon) {
  font-size: 18px !important; /* ikon boyutu */
}

:deep(.q-btn .on-left) {
  margin-right: 4px !important;
}
</style>
