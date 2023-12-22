<script setup lang="ts">
import type { PropType } from 'vue'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { isEmpty } from 'lodash-es'
import type { MachineCardData } from '../types/MachineCard'

const props = defineProps({
  data: {
    type: Object as PropType<MachineCardData>,
    required: true,
  },
})
const { t } = useI18n()
const defaultValue = ref()
const value = ref(
  isEmpty(props.data.erp)
    ? t('no-erp-val')
    : props.data.erp[defaultValue.value],
)
const key = useStorage(
  `machine-${props.data.id}-settings`,
  {
    name: props.data.erp ? defaultValue : ' ',
    val: value,
  },
  localStorage,
  { mergeDefaults: true },
)
</script>

<template>
  <q-btn
    :label="`${key.name === void 0 ? '' : key.name} ${
      key.val === void 0
        ? t('no-erp-val')
        : typeof key.val === 'number'
          ? Number.isInteger(key.val)
            ? key.val
            : key.val.toFixed(2)
          : key.val
    }`"
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
          <span class="w-full" @click="(key.val = item), (key.name = idx)">
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
