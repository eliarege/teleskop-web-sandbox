<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { QBtn, QIcon, QTooltip } from 'quasar'
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
</script>

<template>
  <div class="flex w-full flex-nowrap items-center justify-between overflow-hidden">
    <!-- LEFT SIDE -->
    <div class="flex flex-1 items-center">
      <!-- Left Drawer Button -->
      <QBtn
        class="text-gray-6 dark:text-gray-3"
        icon="i-material-symbols:left-panel-open-outline-rounded"
        square
        flat
        @click="leftDrawerOpen = !leftDrawerOpen"
      />

      <!-- Button Container -->
      <CollapsibleButtonBar
        :buttons="visibleContextBarButtons"
        :menu-tooltip="t('contextBar.menuTooltip')"
      />
    </div>

    <!-- RIGHT SIDE -->
    <div class="flex flex-nowrap items-center justify-end">
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
        icon="i-material-symbols:right-panel-open-outline-rounded"
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
</style>
