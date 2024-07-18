<script setup lang="ts">
import ConfirmationDialog from './ConfirmationDialog.vue'
import { useStateStore } from '~/store/State'

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  minSize: {
    type: Number,
  },
})

const emit = defineEmits(['click'])
const { notifySuccess, notifyFail } = useNotify()
const innerWidth = ref(window.innerWidth)
function handleResize() {
  innerWidth.value = window.innerWidth
}
useResizeObserver(document.body, () => {
  handleResize()
})
const stateStore = useStateStore()
const q = useQuasar()
const { t } = useI18n()

async function clickBtn() {
  q.dialog({
    component: ConfirmationDialog,
    componentProps: {
      bodyText: t('confirmationDialogBody.SyncDataConfirmation', { name: t(`${props.type}`).toLowerCase() }),
      confirmBtn: {
        label: t('Confirm'),
        color: 'primary',
        icon: 'done',
      },
      cancelBtn: {
        label: t('Cancel'),
        icon: 'close',
      },
    },
  }).onOk(async () => {
    try {
      stateStore.isLoading = true
      await $fetch(`/api/teleskop/sync/${props.type.toLowerCase()}`, { method: 'POST' })
      notifySuccess(t('Success'))
    } catch (e) {
      notifyFail(t('Failed'))
    } finally {
      stateStore.isLoading = false
      emit('click')
    }
  })
}
</script>

<template>
  <QBtn
    :label="!minSize || innerWidth > minSize ? $t('SyncData') : ''"
    no-caps
    icon="refresh"
    color="primary"
    class="h-12"
    style="white-space: nowrap; text-overflow: ellipsis;"
    clickable
    @click="clickBtn"
  >
    <QTooltip
      v-if="minSize && innerWidth <= minSize"
      :offset="[10, 10]"
    >
      {{ t('SyncData') }}
    </QTooltip>
  </QBtn>
</template>

<style scoped lang="postcss">
</style>
