<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { QBtn, QList, QMenu } from 'quasar'
import type { MachineData } from '~/shared/types'
import { useDataStore } from '~/store/Datas'

const props = defineProps({
  data: {
    type: Object as PropType<MachineData>,
    required: true,
  },
})
const { t } = useI18n()
const store = useDataStore()

const isKeyEmpty = computed(() => store.erpKeys.find(e => e.id === props.data.id)?.key === '' || !store.erpKeys.find(e => e.id === props.data.id))
if (isKeyEmpty.value && props.data.erp) {
  const firstKey = Object.keys(props.data.erp)[0]
  if (firstKey) {
    store.erpKeys.push({ id: props.data.id, key: firstKey })
  }
}

const erpKey = ref(store.erpKeys.find(e => e.id === props.data.id)?.key || '')

const erpLabel = computed(() => {
  if (!props.data.erp)
    return t('no-erp-val')
  if (!erpKey.value)
    return t('no-erp-val')
  const value = props.data.erp[erpKey.value]
  return typeof value === 'number' && !Number.isInteger(value)
    ? value.toFixed(2)
    : value
})

function updateErpKey(newKey: string) {
  erpKey.value = newKey
  const existingIndex = store.erpKeys.findIndex(e => e.id === props.data.id)
  if (existingIndex !== -1) {
    store.erpKeys[existingIndex].key = newKey
  } else {
    store.erpKeys.push({ id: props.data.id, key: newKey })
  }
}
</script>

<template>
  <QBtn
    :label="erpLabel"
    rounded
    :disable="!props.data.erp"
  >
    <QMenu
      :auto-close="true"
      transition-show="jump-down"
      transition-hide="jump-up"
    >
      <QList class="py-2 max-h-120">
        <q-item
          v-for="(item, idx) in data.erp"
          :key="idx"
          clickable
          dense
          class="divide-y"
          @click="updateErpKey(idx)"
        >
          <q-item-section>
            <q-item-label class="text-black">
              {{ idx }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </QList>
    </QMenu>
  </QBtn>
</template>

<style scoped>
.q-btn {
  width: 100%;
  font-weight: 600;
}
</style>
