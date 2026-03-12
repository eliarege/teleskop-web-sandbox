<script setup lang="ts">
import type { MachineData } from '~/shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { notify } = useQuasar()
const { data: machine } = await useFetch<MachineData>('/api/machines', {
  method: 'GET',
  query: {
    machineId: route.query.machineId,
  },
})
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
  }
})
</script>

<template>
  <div class="overflow-hidden">
    <MachineCardSingle :machine />
  </div>
</template>

<style scoped lang="postcss">
</style>
