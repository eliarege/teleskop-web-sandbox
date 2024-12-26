<script setup lang="ts">
import type { Command } from '~/types'
import { userSettingsStore } from '~/composables/userSettingsStore'

const props = defineProps<{
  // Idk the type yet
  commands: Command[]
}>()

const settingsStore = userSettingsStore()

const isChoosingColor = ref(false)
const selectedColor = ref<string | undefined>(undefined)
const selectedID = ref<string | undefined>(undefined)

function getCommandColor(id: string): string {
  const setting = settingsStore.getSetting(id)
  return setting ? setting.color : '#FFFFFF'
}

// function applyColorChange() {
//   if (selectedID.value) {
//     settingsStore.updateSetting(
//       selectedID.value,
//       selectedColor.value || '#FFFFFF',
//       settingsStore.getSetting(selectedID.value)?.selected || false,
//     )
//     isChoosingColor.value = false
//   }
// }

function showColorChanger(id: string) {
  selectedID.value = id
  selectedColor.value = getCommandColor(id)
  isChoosingColor.value = true
}
</script>

<template>
  <div class="flex flex-col items-start w-full h-full gap-2 mt-5 ml-5">
    <div
      v-for="command in props.commands"
      :key="command.iokey"
      class="flex flex-row items-center w-full"
    >
      <div
        :style="{ backgroundColor: getCommandColor(command.iokey) }"
        class="w-5 h-5 rounded-md cursor-pointer"
        @click="showColorChanger(command.iokey)"
      />
      <span class="pl-3 w-50% bg-gray-300 text-left text-lg">{{ command.name }}</span>
      <span class="pl-3 w-20% bg-white text-lg">{{ command.ioValue.toFixed(2) }}</span>
    </div>
  </div>
  <div v-if="isChoosingColor" class="fixed inset-0 z-50 flex justify-center items-center bg-gray-800 bg-opacity-50">
    <div class="bg-white p-4 rounded shadow-lg">
      <q-color
        v-model="selectedColor"
        class="w-full"
        dense
        no-header
        no-footer
      />
      <div class="flex justify-center mt-2">
        <q-btn
          class="mx-2"
          dense
          color="white"
          text-color="black"
          label="Cancel"
          @click="isChoosingColor = false"
        />
        <q-btn
          dense
          color="white"
          text-color="black"
          label="Confirm"
        />
        <!-- @click="applyColorChange" -->
      </div>
    </div>
  </div>
</template>
