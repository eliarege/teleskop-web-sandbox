<script setup lang="ts">
const props = defineProps({
  vis: Boolean,
})
const emit = defineEmits(['update:vis'])

const { t } = useI18n()
function closeDialog() {
  emit('update:vis', false)
}
const selectedOption = ref('selectedMachine')
const machines = ref([])
machines.value = await $fetch('/api/machine')
const selectedMachine = ref()
const selectedPrinter = ref()
const printers = ref([1, 2, 3, 4, 5])
</script>

<template>
  <q-dialog :model-value="props.vis" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ t('printProgramListDialog.printOptions') }}
        </div>
        <q-space />
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
          @click="closeDialog"
        />
      </q-card-section>

      <q-card-section class="w-100">
        <div class="text-h6">
          {{ t('printProgramListDialog.machineList') }}
        </div>
        <div class="flex flex-col m-5">
          <div class="flex flex-row gap-5">
            <q-radio
              v-model="selectedOption"
              val="selectedMachine"
              :label="t('printProgramListDialog.selectedMachine')"
            />
            <q-space />
            <q-select
              v-model="selectedMachine"
              class="w-30"
              :disable="selectedOption !== 'selectedMachine'"
              :options="machines"
              option-label="name"
              option-value="machineId"
            />
          </div>
          <q-radio
            v-model="selectedOption"
            val="all"
            :label="t('printProgramListDialog.all')"
          />
        </div>
        <div class="text-h6">
          {{ t('printProgramListDialog.printer') }}
          <div class="m-5">
            <q-select v-model="selectedPrinter" :options="printers" />
          </div>
        </div>
      </q-card-section>
      <q-card-section class="flex gap-5">
        <q-btn :label="t('printProgramListDialog.print')" />
        <q-btn :label="t('printProgramListDialog.preview')" />
        <q-space />
        <q-btn :label="t('printProgramListDialog.cancel')" @click="closeDialog" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
