<script setup lang="ts">
const props = defineProps<{
  machineId: number
  machineName: string
}>()
const emits = defineEmits(['close'])
const kc = useKeycloak()
const { t } = useI18n()
const title = ref('')
const message = ref('')

const sendButtonDisabled = computed(() => message.value === '' || title.value === '')

function sendMessage() {
  kc.fetch('/api/sendMessage', {
    method: 'POST',
    body: {
      machineId: props.machineId,
      title: title.value,
      message: message.value,
    },
  })
  emits('close')
}
</script>

<template>
  <div class="w-full max-h-200 p-5 overflow-auto border border-3 border-gray-600 rounded z-100 bg-white flex-center flex-col gap-3">
    <span class="text-center w-full h-full text-bold">
      {{ t('send-message._', { machineName }) }}
    </span>
    <q-input
      v-model="title"
      dense
      :maxlength="50"
      :placeholder="t('send-message.title')"
    />
    <q-input
      v-model="message"
      dense
      type="textarea"
      :placeholder="t('send-message.message')"
    />
    <q-btn
      :label="t('send-message.send')"
      icon="send"
      color="primary"
      class="px-3"
      dense
      no-caps
      :disable="sendButtonDisabled"
      @click="sendMessage"
    />
  </div>
</template>
