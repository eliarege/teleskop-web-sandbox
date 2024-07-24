<script setup lang="ts">
import type { PlanParameterProps } from '~/shared/types'

defineProps<{ planParameters: PlanParameterProps, jobOrder: string, machineId: number }>()

const tab = ref('planParameter')
</script>

<template>
  <div class="w-full h-full">
    <q-tabs
      v-model="tab"
      ripple="false"
    >
      <q-tab name="planParameter" label="Plan Parametreleri" />
      <q-tab name="recipe" label="Reçete" />
    </q-tabs>

    <q-separator />

    <q-tab-panels
      v-model="tab"
      animated
    >
      <q-tab-panel name="planParameter">
        <PlanParameters v-bind="planParameters" />
      </q-tab-panel>
      <q-tab-panel name="recipe">
        <PlanRecipe :job-order="jobOrder" :machine-id="machineId" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
