<script setup lang="ts">
import type { MachineStatus } from '~/shared/types'

interface GroupedMachineSelectorProps {
  group: string
  machines: MachineStatus[]
}

defineProps<GroupedMachineSelectorProps>()
const emits = defineEmits(['selectedGroup', 'selectedMachines'])

const selectedMachines = defineModel('selectedMachine', { type: Array as PropType<number[]>, required: true })
const selectedGroup = defineModel('selectedGroup', { type: Array as PropType<string[]>, required: true })
</script>

<template>
  <div>
    <q-list bordered class="max-h-100 overflow-auto">
      <q-expansion-item
        expand-separator
        default-opened
        dense-toggle
        :label="group"
      >
        <q-list
          v-for="machine in machines"
          :key="machine.id"
          v-ripple
          clickable
          class="max-h-100 overflow-auto"
        >
          <q-item-section>
            <div class="flex items-center">
              <q-checkbox v-model="selectedMachines" :val="machine.id" />
              {{ machine.name }}
            </div>
          </q-item-section>
        </q-list>
        <template #header>
          <div class="w-full">
            <div class="w-full h-full flex items-center">
              <div>
                <q-checkbox
                  :model-value="selectedGroup"
                  :val="group"
                  @update:model-value="emits('selectedGroup')"
                />
              </div>
              <div class="text-l font-extrabold">
                {{ group }}
              </div>
            </div>
          </div>
        </template>
      </q-expansion-item>
    </q-list>
  </div>
</template>

<style scoped lang="postcss">
</style>
