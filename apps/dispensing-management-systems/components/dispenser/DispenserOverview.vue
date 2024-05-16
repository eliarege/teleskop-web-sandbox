<script lang="ts" setup>
import DispenserEditDialog from './DispenserEditDialog.vue'
import type { Dispenser } from '~/shared/types'
import { useDataStore } from '~/store/DataStore'
import { useStateStore } from '~/store/State'

const props = defineProps({
  dispenser: {
    type: Object as PropType<Dispenser>,
    required: true,
  },
})
const { t } = useI18n()
const q = useQuasar()
const { notifySuccess, notifyFail } = useNotify()
const dataStore = useDataStore()
const stateStore = useStateStore()

const dispenser = toRef(props, 'dispenser')
async function onPing() {
  try {
    stateStore.isLoading = true
    await $fetch('/api/ping', { method: 'POST', body: { address: dispenser.value.dispenserIP }})
    notifySuccess(t('Success'))
  } catch (e) {
    console.error(e)
    notifyFail(t('Failed'))
  } finally {
    stateStore.isLoading = false
  }
}

function onClickJobOrders() {
  navigateTo({
    path: `/jobOrders`,
    query: { dispenserId: dispenser.value.dispenserId },
  })
}

function onClickScreen() {
  navigateTo({
    path: `/vnc/${dispenser.value.dispenserId}`,
  })
}

function onClickEdit() {
  q.dialog({
    component: DispenserEditDialog,
    componentProps: { dispenser },
  }).onOk(async (payload) => {
    if (payload)
      dataStore.selectedDispenser = payload
    else navigateTo({
      path: '/',
    })
    await onRefreshList()
    notifySuccess(t('Success'))
  })
}

function onClickConnections() {
  navigateTo({
    path: '/dispenser/connections',
    query: { dispenserId: dispenser.value.dispenserId },
  })
}
async function onRefreshList() {
  const dispensers = await $fetch<Dispenser[]>(`/api/dispensers`)
  dataStore.dispensers = dispensers
}
watch((dispenser), () => {
  dataStore.title = dispenser.value.dispenserName
})
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
        {{ t('JobOrders') }}
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
    <div class="q-mt-md">
      <QBtn
        class="h-10vh w-40vw b-rd-2 text-lg"
        color="primary"
        no-caps
        icon="link"
        @click="onClickConnections"
      >
        {{ t('Connections') }}
      </QBtn>
    </div>
  </div>
</template>
