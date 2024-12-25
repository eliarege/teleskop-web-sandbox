<script setup lang="ts">
import { useKeycloak } from '@teleskop/nuxt-base/composables/useKeycloak'

const props = defineProps({
  machines: Array,
})

defineEmits([
  ...useDialogPluginComponent.emits,
])

const { fetch } = useKeycloak()

const { t } = useI18n()
const { dialogRef, onDialogCancel } = useDialogPluginComponent()

const selectedMachine = ref()
const programGroup = ref([])
const programOptions = ref([] as any[])
const commandGroup = ref([])
const commandOptions = ref([] as any[])
async function machineSelected(e) {
  selectedMachine.value = e
  programOptions.value = await fetch(`/api/machine/${selectedMachine.value.id}/program?asList=true`)
  commandOptions.value = await fetch(`/api/machine/${selectedMachine.value.id}/commands?asList=true`)
  commandOptions.value = commandOptions.value.map(row => ({
    name: row.name,
    value: row.value,
    label: `${row.value}. ${row.name}`,
  }))
  programOptions.value = programOptions.value.map(row => ({
    name: row.name,
    value: row.value,
    label: `${row.value}. ${row.name}`,
  }))
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent>
    <q-card class="min-h-40 min-w-120">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ t('printProgramDialog.programPrintOptions') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
          @click="onDialogCancel"
        />
      </q-card-section>

      <q-card-section>
        <div>{{ t('printProgramDialog.selectMachine') }}</div>
        <q-select
          :model-value="selectedMachine"
          dense
          :options="machines"
          option-label="name"
          @update:model-value="machineSelected"
        />
      </q-card-section>
      <q-card-section v-if="programOptions.length">
        <div class="flex">
          {{ t('printProgramDialog.selectPrograms') }}
          <q-space />
          <OptionGroupFunctionalityButtons
            v-model="programGroup"
            :options="programOptions"
          />
        </div>
        <div class="flex max-h-60 overflow-y-scroll">
          <q-option-group
            v-model="programGroup"
            dense
            class="p-5"
            :options="programOptions"
            type="checkbox"
          />
        </div>
      </q-card-section>
      <q-card-section v-if="commandOptions.length">
        <div class="flex">
          {{ t('printProgramDialog.selectCommands') }}
          <q-space />
          <OptionGroupFunctionalityButtons
            v-model="commandGroup"
            :options="commandOptions"
          />
        </div>
        <div class="flex max-h-60 overflow-y-scroll">
          <q-option-group
            v-model="commandGroup"
            dense
            class="p-5"
            :options="commandOptions"
            type="checkbox"
          />
        </div>
      </q-card-section>
      <q-card-section v-if="programOptions.length && commandOptions.length">
        <div class="flex">
          <q-space />
          <q-btn
            :label="t('submit')"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
