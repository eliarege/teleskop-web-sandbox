<script setup lang="ts">
import { Toast } from '@bryntum/schedulerpro'
import type { FetchError } from 'ofetch'

const props = defineProps<{
  machineId: number
  machineName: string
}>()
const emit = defineEmits(['close'])
const kc = useKeycloak()
const { t } = useI18n()
const title = ref('')
const message = ref('')
const loading = ref(false)

const sendButtonDisabled = computed(() => message.value === '' || title.value === '')

async function sendMessage() {
  loading.value = true
  try {
    await kc.fetch('/api/sendMessage', {
      method: 'POST',
      body: {
        machineId: props.machineId,
        title: title.value,
        message: message.value,
      },
    })
    Toast.show(t('send-message.toast.succesful'))
    emit('close')
  } catch (err) {
    console.error(err)
    Toast.show(t('send-message.toast.fail', { err: (err as FetchError).message }))
  } finally {
    loading.value = false
  }
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
      :loading
      :disable="sendButtonDisabled"
      @click="sendMessage"
    />
  </div>
</template>
