<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar'

const props = defineProps({
  erpParameters: Array,
})
defineEmits([
  ...useDialogPluginComponent.emits,
])
const { dialogRef, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { t } = useI18n()
const parameters: Ref<Array<any>> = ref(props.erpParameters)
const buttons = [
  {
    icon: 'check',
    tooltip: t('selectAll'),
    onClick: () => parameters.value.forEach(p => p.BATCHREPORTVISIBLE = true),
  },
  {
    icon: 'remove',
    tooltip: t('dropAll'),
    onClick: () => parameters.value.forEach(p => p.BATCHREPORTVISIBLE = false),
  },
  {
    icon: 'sync_alt',
    tooltip: t('selectReverse'),
    onClick: () => parameters.value.forEach(p => p.BATCHREPORTVISIBLE = !p.BATCHREPORTVISIBLE),
  },
]
</script>

<template>
  <q-dialog
    ref="dialogRef"
    persistent
  >
    <q-card>
      <q-card-section>
        <div>
          <div class="text-2xl">
            {{ t('joborderSummarySettings._') }}
          </div>
          <div class="text-lg whitespace-normal mt-5 w-140">
            {{ t('joborderSummarySettings.description') }}
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="w-full m--5 flex">
          <q-space />
          <q-btn
            v-for="(button, index) in buttons"
            :key="index"
            dense
            flat
            @click="button.onClick()"
          >
            <q-icon :name="button.icon" size="xs" />
            <q-tooltip> {{ button.tooltip }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="max-h-100 w-full overflow-y-scroll">
          <div
            v-for="param in parameters"
            :key="`erp-${param.PARAMID}`"
            class="mb-1 text-xl cursor-pointer"
            @click="param.BATCHREPORTVISIBLE = !param.BATCHREPORTVISIBLE"
          >
            <q-checkbox
              v-model="param.BATCHREPORTVISIBLE"
              :label="param.PARAMNAME"
              dense
              class="my-3 ml-5"
            />
            <q-separator />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          outline
          :label="t('save')"
          color="black"
          icon="save"
          @click="onDialogOK(parameters)"
        />
        <q-btn
          v-close-popup
          :label="t('cancel')"
          outline
          color="black"
          icon="close"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
  .q-dialog__inner--minimized > div {
  max-width: none;
}
</style>
