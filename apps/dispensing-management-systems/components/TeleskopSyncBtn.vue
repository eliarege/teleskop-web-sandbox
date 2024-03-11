<script setup lang="ts">
import { useStateStore } from '~/store/State'

const props = defineProps({
  link: {
    type: String,
    required: true,
  },
  minSize: {
    type: Number,
  },
})
const emit = defineEmits(['click'])
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
  try {
    stateStore.isLoading = true
    await $fetch(props.link)
    q.notify({
      color: 'green-4',
      textColor: 'white',
      icon: 'done',
      message: t('Success'),
      timeout: 3000,
    })
  } catch (e) {
    q.notify({
      color: 'red-4',
      textColor: 'white',
      icon: 'cancel',
      message: t('Failed'),
      timeout: 3000,
    })
  } finally {
    stateStore.isLoading = false
    emit('click')
  }
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
