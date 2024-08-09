<script setup lang="ts">
import { mdiChevronDown, mdiChevronUp } from '@quasar/extras/mdi-v7'
import { useFuse } from '@vueuse/integrations/useFuse'

const emit = defineEmits(['scrollToEvent'])
const { data: events } = useFetch('/api/queueBased/allScheduledEvents', {
  default: () => [],
})
const { t } = useI18n()
const text = ref('')
const dropdownOpen = ref(false)

const exactMatch = ref(false)
const options = computed(() => ({
  fuseOptions: {
    keys: ['jobOrder'],
    isCaseSensitive: false,
    threshold: exactMatch.value ? 0 : undefined,
  },
  matchAllWhenSearchEmpty: true,
}))

const { results } = useFuse(text, events, options)

function onItemSelect(item: { jobOrder: string, startTime: string }) {
  text.value = item.jobOrder
  emit('scrollToEvent', item)
}
</script>

<template>
  <div class="p-1">
    <q-input
      v-model="text"
      dense
      flat
      borderless
      :placeholder="t('navbar.job-order-search')"
      clearable
      text-color="gray-1"
      class="border-1 border-gray-300 rounded"
      @focus="() => dropdownOpen = true"
    >
      <template #before>
        <br>
      </template>
      <template #after>
        <div class="flex-center w-full h-full rounded transition-all">
          <q-btn
            color="white"
            class="w-full h-full"
            dense
            :icon="dropdownOpen ? mdiChevronUp : mdiChevronDown"
            flat
          >
            <q-menu
              v-model="dropdownOpen"
              auto-close
              no-focus
              no-refocus
            >
              <q-list>
                <q-virtual-scroll
                  v-slot="{ item }"
                  style="max-height: 300px;"
                  :items="results"
                  separator
                >
                  <q-item
                    dense
                    clickable
                    @click="onItemSelect(item.item)"
                  >
                    <q-item-section>
                      <q-item-label>
                        {{ item.item.jobOrder }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-virtual-scroll>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </template>
    </q-input>
  </div>
</template>

<style scoped lang="postcss">
</style>
