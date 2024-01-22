<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import type { MachineCardData } from '../types'

const props = defineProps({
  data: {
    type: Object as PropType<MachineCardData>,
    required: true,
  },
})
const { t } = useI18n()

const erpKey = useStorage<string | null>(
  `machine-${props.data.id}-settings`,
  null,
  localStorage,
  { mergeDefaults: true },
)

const erpLabel = computed(() => {
  if (!props.data.erp)
    return t('no-erp-val')
  if (!erpKey.value)
    return ''
  const value = props.data.erp[erpKey.value]
  return typeof value === 'number' && !Number.isInteger(value)
    ? value.toFixed(2)
    : value
})
</script>

<template>
  <q-btn
    :label="erpLabel"
    rounded
    :disable="!props.data.erp"
  >
    <q-menu
      :auto-close="true"
      transition-show="jump-down"
      transition-hide="jump-up"
    >
      <q-list>
        <q-item
          v-for="(item, idx) in data.erp"
          :key="idx"
          clickable
        >
          <span class="w-full" @click="erpKey = idx">
            <q-item-section>
              <q-item-label class="p-3 text-black border-b border-b-gray-200">
                {{ idx }}
              </q-item-label>
            </q-item-section>
          </span>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<style scoped>
.q-btn {
  width: 100%;
  font-weight: 600;
}
</style>
