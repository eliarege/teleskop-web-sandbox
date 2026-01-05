<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { withBase } from 'ufo'
import { useLongOperation } from '../composables/useLongOperation'
import type { FetchOptions, LogEntry } from '../composables/useLongOperation'

const props = withDefaults(defineProps<{
  url: string
  fetchOptions?: FetchOptions
  title?: string
  width?: string | number
  statusTitles?: {
    running?: string
    success?: string
    failed?: string
  }
}>(), {
  width: '700px',
})

const emit = defineEmits([
  ...useDialogPluginComponent.emits,
  'close',
  'abort',
  'retry',
])

const config = useRuntimeConfig()
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent()
const logsContainer = ref<HTMLElement | null>(null)
const operation = useLongOperation()
const showLogs = ref(false)

const state = reactive({
  logs: operation.logs,
  progress: operation.progress,
  isRunning: operation.isRunning,
  isSuccess: operation.isSuccess,
  isAborted: operation.isAborted,
  isError: operation.isError,
  errorMessage: operation.errorMessage,
})

function startOperation() {
  operation.start(withBase(props.url, config.app.baseURL), props.fetchOptions)
}

startOperation()

export type LongOperationResult =
  | { success: true }
  | { success: false, aborted: boolean, error: string }

const currentProgress = computed(() => operation.progress.value ?? 0)

const canClose = computed(() => state.isSuccess || state.isAborted || state.isError)

const statusIcon = computed(() => {
  if (state.isRunning)
    return 'sync'
  if (state.isSuccess)
    return 'check_circle'
  if (state.isAborted)
    return 'cancel'
  if (state.isError)
    return 'error'
  return 'hourglass_empty'
})

const statusColor = computed(() => {
  if (state.isRunning)
    return 'primary'
  if (state.isSuccess)
    return 'positive'
  if (state.isAborted)
    return 'warning'
  if (state.isError)
    return 'negative'
  return 'grey'
})

const statusText = computed(() => {
  if (state.isRunning)
    return t('operation.running')
  if (state.isSuccess)
    return t('operation.completed')
  if (state.isAborted)
    return t('operation.aborted')
  if (state.isError)
    return t('operation.failed')
  return t('operation.pending')
})

const statusTitle = computed(() => {
  if (state.isRunning)
    return props.statusTitles?.running ?? props.title
  if (state.isSuccess)
    return props.statusTitles?.success ?? props.title
  if (state.isError || state.isAborted)
    return props.statusTitles?.failed ?? props.title
  return props.title
})

const progressColor = computed(() => {
  if (state.isSuccess)
    return 'positive'
  if (state.isError)
    return 'negative'
  if (state.isAborted)
    return 'warning'
  return 'primary'
})

function getLogColor(level: LogEntry['level']) {
  switch (level) {
    case 'error': return 'text-negative'
    case 'warn': return 'text-warning'
    case 'success': return 'text-positive'
    default: return 'text-grey-4'
  }
}

function getLogPrefix(level: LogEntry['level']) {
  switch (level) {
    case 'error': return '[ERROR]'
    case 'warn': return '[WARN]'
    case 'success': return '[SUCCESS]'
    default: return '[INFO]'
  }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getResult(): LongOperationResult {
  if (state.isSuccess) {
    return { success: true }
  } else if (state.isAborted) {
    return { success: false, aborted: true, error: t('operation.abortedByUser') }
  } else if (state.isError) {
    return { success: false, aborted: false, error: state.errorMessage || t('operation.unknownError') }
  } else {
    return { success: false, aborted: false, error: t('operation.notCompleted') }
  }
}

function toUnit(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value
}

const canRetry = computed(() => state.isError || state.isAborted)

function handleClose() {
  if (canClose.value) {
    emit('close')
    operation.reset()
    onDialogOK(getResult())
  }
}

function handleAbort() {
  emit('abort')
  operation.abort()
}

function handleRetry() {
  emit('retry')
  startOperation()
}

// Auto-scroll to bottom when new logs arrive
watch(
  () => state.logs.length,
  async () => {
    await nextTick()
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  },
)
</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
    :maximized="$q.screen.lt.sm"
    transition-show="slide-down"
    transition-hide="slide-up"
    class="operation-log-dialog"
    position="top"
    @hide="onDialogHide"
  >
    <q-card class="q-dialog-plugin operation-log-card select-none" :style="`width: ${toUnit(props.width)}; max-width: 90vw;`">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ statusTitle }}
        </div>
        <q-space />
        <q-chip
          :color="statusColor"
          text-color="white"
          :icon="statusIcon"
          :ripple="false"
          class="select-none"
        >
          {{ statusText }}
        </q-chip>
      </q-card-section>

      <!-- Progress Bar -->
      <q-card-section class="q-pb-none">
        <q-linear-progress
          :value="currentProgress / 100"
          :color="progressColor"
          size="28px"
          rounded
          :indeterminate="state.isRunning && currentProgress === 0"
          :stripe="state.isRunning"
          :animation-speed="200"
          class="my-4 select-none"
        >
          <div class="absolute w-full h-full flex-center">
            <q-badge
              color="white"
              :text-color="progressColor"
              :label="`${state.progress}%`"
              class="pt-1"
            />
          </div>
        </q-linear-progress>
      </q-card-section>

      <!-- Logs Accordion -->
      <q-card-section class="q-py-none">
        <q-expansion-item
          v-model="showLogs"
          :label="t('operation.viewDetails')"
          switch-toggle-side
          header-class="text-grey-7"
          dense
        >
          <div
            ref="logsContainer"
            class="console-output bg-dark text-grey-4 q-pa-md rounded-borders q-mt-sm select-text"
          >
            <div
              v-for="(log, index) in state.logs"
              :key="index"
              class="log-entry"
              :class="getLogColor(log.level)"
            >
              <span class="log-time text-grey-6">{{ formatTime(log.timestamp) }}</span>
              <span class="log-prefix" :class="getLogColor(log.level)">{{ getLogPrefix(log.level) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="state.logs.length === 0" class="text-grey-6 text-italic">
              {{ t('operation.waitingForStart') }}
            </div>
            <div v-if="state.isRunning" class="cursor-blink">
              _
            </div>
          </div>
        </q-expansion-item>
      </q-card-section>

      <!-- Error Message -->
      <q-card-section v-if="state.isError && state.errorMessage" class="q-pt-none mt-2">
        <q-banner class="bg-negative text-white rounded-borders">
          <template #avatar>
            <q-icon name="error" />
          </template>
          {{ state.errorMessage }}
        </q-banner>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          v-if="state.isRunning"
          flat
          :label="t('operation.abort')"
          color="negative"
          icon="cancel"
          @click="handleAbort"
        />
        <q-btn
          v-if="canRetry"
          flat
          :label="t('operation.retry')"
          color="primary"
          icon="refresh"
          @click="handleRetry"
        />
        <q-btn
          :disable="!canClose"
          :color="state.isSuccess ? 'positive' : (state.isAborted ? 'warning' : 'primary')"
          :label="canClose ? t('operation.close') : t('operation.pleaseWait')"
          :icon="state.isSuccess ? 'check' : (state.isAborted ? 'close' : undefined)"
          :loading="state.isRunning"
          @click="handleClose"
        >
          <q-tooltip v-if="!canClose && !state.isRunning">
            {{ t('operation.mustCompleteBeforeClosing') }}
          </q-tooltip>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.operation-log-card {
  display: flex;
  flex-direction: column;
  border-top-left-radius: 4px !important;
  border-top-right-radius: 4px !important;
}

.console-output {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.log-entry {
  white-space: nowrap;
  word-break: break-word;
}

.log-time {
  margin-right: 8px;
  font-size: 11px;
}

.log-prefix {
  margin-right: 8px;
  font-weight: bold;
  font-size: 11px;
}

.cursor-blink {
  display: inline-block;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Custom scrollbar for console */
.console-output::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.console-output::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.console-output::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.console-output::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

<style>
.operation-log-dialog .fixed-top {
  top: 20px;
}
</style>
