<script lang="ts" setup>
import EditDispenser from './EditDispenser.vue';
import type { Dispenser } from '~/shared/types'
import { useStateStore } from '~/store/State'

const props = defineProps({
  dispenser: {
    type: Object as PropType<Dispenser>,
    required: true,
  },
})
const { t } = useI18n()
const q = useQuasar()
const stateStore = useStateStore()

const dispenser = props.dispenser
// Placeholder ping method
async function onPing() {
  try {
    stateStore.isLoading = true
    const ping = await useFetch(`http://${dispenser.dispenserIP.split(':')[0]}`, {
      mode: 'no-cors',
      timeout: 3000,
    })
    if (ping.status.value === 'success')
      q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'done',
        message: t('Success'),
        timeout: 3000,
      })
    else
      q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cancel',
        message: t('Failed'),
        timeout: 3000,
      })
  } catch (e) {
    console.error(e)
    q.notify({
      color: 'red-4',
      textColor: 'white',
      icon: 'cancel',
      message: t('Failed'),
      timeout: 3000,
    })
  } finally {
    stateStore.isLoading = false
  }
}

function onClickJobOrders() {
  navigateTo({
    path: `/jobOrders/${dispenser.dispenserId}`,
  })
}

function onClickScreen() {
  navigateTo({
    path: `/vnc/${dispenser.dispenserId}`,
  })
}

function onClickEdit() {
  q.dialog({
    component: EditDispenser,
    componentProps: {dispenser: dispenser}
  })
}
</script>

<template>
  <div class="q-pa-md flex-center flex-col items-center">
    <div class="flex-col">
      <div class="flex items-center">
        <img
          src="/dispenser.png"
          width="200"
          height="200"
        >
        <QBtn
          round
          flat
          class="h-12 w-12 border-1 border-solid"
          icon="wifi"
          @click="onPing"
        >
          <QTooltip :offset="[10, 10]">
            {{ t('ConnectionCheck') }}
          </QTooltip>
        </QBtn>
      </div>
    </div>
    <div class="q-mt-md">
      <QBtn
        class="h-10vh w-40vw b-rd-2 text-lg"
        color="primary"
        no-caps
        icon="list"
        @click="onClickJobOrders"
      >
        {{ t('Job Orders') }}
      </QBtn>
    </div>
    <div class="q-mt-md">
      <QBtn
        class="h-10vh w-40vw b-rd-2 text-lg"
        color="primary"
        no-caps
        icon="monitor"
        @click="onClickScreen"
      >
        {{ t('Screen') }}
      </QBtn>
    </div>
    <div class="q-mt-md">
      <QBtn
        class="h-10vh w-40vw b-rd-2 text-lg"
        color="primary"
        no-caps
        icon="edit"
        @click="onClickEdit"
      >
        {{ t('Edit') }}
      </QBtn>
    </div>
  </div>
</template>
