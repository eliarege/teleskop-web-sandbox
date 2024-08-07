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
    <q-expansion-item
      dense
      expand-separator
      default-opened
      dense-toggle
      :label="group"
      class="border-1 border-gray-500/30"
    >
      <q-list class="max-h-100 overflow-auto pl-3">
        <q-item
          v-for="machine in machines"
          :key="machine.id"
          v-ripple
          clickable
          dense
          class="q-item-avatar-dense"
        >
          <q-item-section avatar>
            <q-checkbox
              v-model="selectedMachines"
              dense
              :val="machine.id"
            />
          </q-item-section>
          <q-item-section>
            {{ machine.name }}
          </q-item-section>
        </q-item>
      </q-list>
      <template #header>
        <q-item-section
          avatar
          class="q-item-avatar-dense"
        >
          <q-checkbox
            dense
            :model-value="selectedGroup"
            :val="group"
            @update:model-value="emits('selectedGroup')"
          />
        </q-item-section>
        <q-item-section>
          {{ group }}
        </q-item-section>
      </template>
    </q-expansion-item>
  </div>
</template>

<style scoped lang="postcss">
</style>
