<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { QBtn, QList, QMenu } from 'quasar'
import type { MachineData } from '~/shared/types'

const props = defineProps({
  data: {
    type: Object as PropType<MachineData>,
    required: true,
  },
})
const { t } = useI18n()

const erpKey = useStorage<string | null>(
  `machine-${props.data.id}-settings`,
  null,
  localStorage,
)

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
          @click="erpKey = idx"
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

<i18n lang="json">
{
  "en": {
    "no-erp-val": "NO ERP VALUE"
  },
  "tr": {
    "no-erp-val": "ERP DEĞERİ SEÇİLMEDİ"
  }
}
</i18n>
