<script setup lang="ts">
import { matStorage } from '@quasar/extras/material-icons'
import { Toast } from '@bryntum/schedulerpro'

const emit = defineEmits(['updateScheduler'])
const { data } = await useFetch('/api/autoAdd')
const refresDataLoading = ref(false)
const dataCleanupLoading = ref(false)
const { t } = useI18n()
const q = useQuasar()
const kc = useKeycloak()

function dataCleanup() {
  q.dialog({
    title: `<strong>${t('settings.data-cleanup._')}!</strong>`,
    message: t('settings.data-cleanup.cleanup-message'),
    persistent: true,
    html: true,
    ok: {
      push: true,
    },
    cancel: {
      push: true,
      color: 'negative',
    },
  }).onOk(async () => {
    dataCleanupLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 300))
    await kc.fetch('/api/settings/dataCleanup').finally(async () => {
      dataCleanupLoading.value = false
      emit('updateScheduler')
      Toast.show(t('toast.data-cleanup'))
    })
  })
}

function refreshData() {
  q.dialog({
    title: `<strong>${t('settings.data-cleanup.refresh-title')}!</strong>`,
    message: t('settings.data-cleanup.refresh-message'),
    persistent: true,
    html: true,
    ok: {
      push: true,
    },
    cancel: {
      push: true,
      color: 'negative',
    },
  }).onOk(async () => {
    refresDataLoading.value = true
    await new Promise(resolve => setTimeout(resolve, 300))
    await kc.fetch('/api/refreshCustomTables').finally(async () => {
      refresDataLoading.value = false
      Toast.show(t('toast.succesful'))
    })
  })
}

async function updateAutoAdd(value: boolean) {
  await kc.fetch('/api/autoAdd', {
    method: 'PUT',
    body: { value }
  })
}
</script>

<template>
  <div class="w-full h-full p-2">
    <div class="w-full flex-center gap-15 py-3 whitespace-nowrap">
      <q-btn
        dense
        :label="t('settings.data-cleanup._')"
        color="primary"
        icon="storage"
        class="whitespace-nowrap"
        :loading="dataCleanupLoading"
        @click="dataCleanup"
      />
      <!--  -->
      <q-btn
        dense
        :label="t('settings.data-cleanup.refresh-title')"
        color="primary"
        icon="refresh"
        class="whitespace-nowrap"
        :loading="refresDataLoading"
        @click="refreshData"
      />
      <!--  -->
      <q-checkbox
        v-model="data"
        :label="t('settings.auto-add')"
        @update:model-value="updateAutoAdd"
      />
    </div>
  </div>
</template>

<style scoped lang="postcss">
</style>
