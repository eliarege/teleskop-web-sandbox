<script setup lang="ts">
const props = defineProps({
  vis: Boolean,
})
const emit = defineEmits(['update:vis'])

const { t } = useI18n()

const selectedMachine = ref()
const machines = ref([])
machines.value = await $fetch('/api/machine')
const programGroup = ref([])
const selectedPrinter = ref()
const printers = ref([1, 2, 3, 4, 5])
const programOptions = ref([] as any[])
const commandGroup = ref([])
const commandOptions = ref([] as any[])
function closeDialog() {
  emit('update:vis', false)
}
async function machineSelected(e) {
  selectedMachine.value = e
  programOptions.value = await $fetch(`/api/machine/${selectedMachine.value.id}/program?asList=true`)
  commandOptions.value = await $fetch(`/api/machine/${selectedMachine.value.id}/commands?asList=true`)
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
  <q-dialog :model-value="vis" persistent>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ t('printProgramDialog.programPrintOptions') }}
        </div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <div>{{ t('printProgramDialog.selectMachine') }}</div>
        <q-select :model-value="selectedMachine" dense :options="machines" option-label="name" @update:model-value="machineSelected" />
      </q-card-section>
      <q-card-section>
        <div>
          {{ t('printProgramDialog.selectPrograms') }}
          <OptionGroupFunctionalityButtons :model="programGroup" :options="programOptions" @update:model="e => programGroup = e" />
        </div>
        <div class="flex max-h-60 overflow-y-scroll">
          <q-option-group
            v-model="programGroup"
            dense class="p-5"
            :options="programOptions"
            type="checkbox"
          />
        </div>
      </q-card-section>
      <q-card-section>
        <div>
          {{ t('printProgramDialog.selectCommands') }}
          <OptionGroupFunctionalityButtons :model="commandGroup" :options="commandOptions" @update:model="e => commandGroup = e" />
        </div>
        <div class="flex max-h-60 overflow-y-scroll">
          <q-option-group v-model="commandGroup" dense class="p-5" :options="commandOptions" type="checkbox" />
        </div>
      </q-card-section>
      <q-card-section>
        <div>
          {{ t('printProgramDialog.selectPrinter') }}
          <div class="m-5">
            <q-select v-model="selectedPrinter" dense :options="printers" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
