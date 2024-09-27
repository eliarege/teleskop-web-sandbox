<script setup lang="ts">
import { mdiChevronDown, mdiChevronUp } from '@quasar/extras/mdi-v7'

defineProps<{ items: any[] }>()
const emit = defineEmits(['dropdownClick'])

const dropdownOpen = ref(false)
</script>

<template>
  <div class="flex-center w-full h-full rounded transition-all">
    <q-btn
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
            :items
            separator
          >
            <q-item
              dense
              clickable
              @click="emit('dropdownClick', item.name)"
            >
              <q-item-section>
                <q-item-label class="whitespace-nowrap">
                  {{ item.name }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-virtual-scroll>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<style scoped lang="postcss">
</style>
