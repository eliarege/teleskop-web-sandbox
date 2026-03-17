<script setup lang="ts">
import type { MachineData } from '~/shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { notify } = useQuasar()
const { data: machine, refresh } = await useFetch<MachineData>('/api/machines', {
  method: 'GET',
  query: {
    machineId: route.query.machineId,
  },
})
let refreshTimeout: ReturnType<typeof setTimeout> | null = null
let isPollingActive = true

async function scheduleRefresh() {
  await refresh()

  if (!isPollingActive)
    return

  refreshTimeout = setTimeout(scheduleRefresh, 5000)
}

definePageMeta({
  layout: 'empty',
})
onMounted(() => {
  if (!route.query.machineId) {
    notify({
      position: 'top',
      type: 'negative',
      message: t('machine-required'),
    })
    router.back()
    return
  }

  refreshTimeout = setTimeout(scheduleRefresh, 5000)
})

onBeforeUnmount(() => {
  isPollingActive = false

  if (refreshTimeout)
    clearTimeout(refreshTimeout)
})
</script>

<template>
  <div class="overflow-hidden">
    <MachineCardSingle :machine />
  </div>
</template>

<style scoped lang="postcss">
</style>
