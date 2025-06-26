<script setup lang="ts">
interface LogsProps {
  logs: {
    type: string
    message: string
  }[]
}
const props = defineProps<LogsProps>()
const emit = defineEmits(['close'])
const { t } = useI18n()
const compLogs = computed(() => props.logs.filter(l => l.type !== 'uuid'))
</script>

<template>
  <q-dialog>
    <div
      class="bg-white w-full"
    >
      <q-list dense class="max-h-150 overflow-auto">
        <q-item
          v-for="(log, idx) in compLogs"
          :key="idx"
          class="border-b-1 border-b-gray-500-50"
          :class="log.type === 'error' ? 'text-red' : '' "
        >
          <q-item-section avatar>
            {{ log.type }}
          </q-item-section>
          <q-item-section>{{ t(log.message) }}</q-item-section>
        </q-item>
      </q-list>
      <br>
      <div class="flex justify-end items-center p-1">
        <q-btn
          :label="t('dismiss')"
          color="primary"
          @click="emit('close')"
        />
      </div>
    </div>
  </q-dialog>
</template>
