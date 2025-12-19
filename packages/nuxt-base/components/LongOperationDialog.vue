<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useLongOperation } from '../composables/useLongOperation'
import type { LogEntry } from '../composables/useLongOperation'

const props = defineProps<{
  url: string
  options?: Omit<RequestInit, 'body'> & { body?: any }
  title?: string
}>()

const emit = defineEmits([
  ...useDialogPluginComponent.emits,
  'close',
  'abort',
  'retry',
])

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

operation.start(props.url, props.options)

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
    return 'Running...'
  if (state.isSuccess)
    return 'Completed'
  if (state.isAborted)
    return 'Aborted'
  if (state.isError)
    return 'Failed'
  return 'Pending'
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
    return { success: false, aborted: true, error: 'Operation was aborted by the user.' }
  } else if (state.isError) {
    return { success: false, aborted: false, error: state.errorMessage || 'An unknown error occurred.' }
  } else {
    return { success: false, aborted: false, error: 'Operation did not complete.' }
  }
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
  operation.start(props.url, props.options)
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
    <q-card class="q-dialog-plugin operation-log-card" style="width: 700px; max-width: 90vw;">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ title || 'Operation Progress' }}
        </div>
        <q-space />
        <q-chip
          :color="statusColor"
          text-color="white"
          :icon="statusIcon"
          :ripple="false"
        >
          {{ statusText }}
        </q-chip>
      </q-card-section>

      <!-- Progress Bar -->
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-sm">
          <div class="text-body2 text-grey-7">
            Progress
          </div>
          <q-space />
          <div class="text-body2 text-weight-medium">
            {{ Math.round(currentProgress) }}%
          </div>
        </div>
        <q-linear-progress
          :value="currentProgress / 100"
          :color="progressColor"
          size="12px"
          rounded
          :indeterminate="state.isRunning && currentProgress === 0"
          :stripe="state.isRunning"
          :animation-speed="200"
        />
      </q-card-section>

      <!-- Logs Accordion -->
      <q-card-section class="q-pt-none">
        <q-expansion-item
          v-model="showLogs"
          icon="terminal"
          label="View Details"
          caption="Show operation logs"
          header-class="text-grey-7"
          dense
        >
          <div
            ref="logsContainer"
            class="console-output bg-dark text-grey-4 q-pa-md rounded-borders q-mt-sm"
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
              Waiting for operation to start...
            </div>
            <div v-if="state.isRunning" class="cursor-blink">
              _
            </div>
          </div>
        </q-expansion-item>
      </q-card-section>

      <!-- Error Message -->
      <q-card-section v-if="state.isError && state.errorMessage" class="q-pt-none">
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
          label="Abort"
          color="negative"
          icon="cancel"
          @click="handleAbort"
        />
        <q-btn
          v-if="canRetry"
          flat
          label="Retry"
          color="primary"
          icon="refresh"
          @click="handleRetry"
        />
        <q-btn
          :disable="!canClose"
          :color="state.isSuccess ? 'positive' : (state.isAborted ? 'warning' : 'primary')"
          :label="canClose ? 'Close' : 'Please wait...'"
          :icon="state.isSuccess ? 'check' : (state.isAborted ? 'close' : undefined)"
          :loading="state.isRunning"
          @click="handleClose"
        >
          <q-tooltip v-if="!canClose && !state.isRunning">
            Operation must complete successfully before closing
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
  white-space: pre-wrap;
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
