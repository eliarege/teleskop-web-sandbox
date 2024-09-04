<script setup lang="ts">
import type { PlanParameters } from '~/shared/types'
import { useSettingStore } from '~/store/settings'

const emit = defineEmits([
  'refreshScheduler',
  'addGridColumn',
  'removeGridColumn',
  'dateRangeEnd',
  'zoom-in',
  'zoom-out',
  'reset-zoom',
])

const { t } = useI18n()
const store = useSettingStore()
// #region MODALS
const settings = ref(false)

const planParameters = ref(false)
const planParametersProps = computed(() => ({
  planKey: store.selectedEvent.planKey,
  machineId: store.selectedEvent.machineId,
  progNoList: store.selectedEvent.planKey,
  isBatchStarted: !(store.selectedEvent.eventType === 'planned'),
  missingParams: [] as PlanParameters[],
  isSendMachine: false,
}))

const recipe = ref(false)
const recipeProps = reactive({
  machineId: store.selectedEvent.machineId || 0,
  jobOrder: store.selectedEvent.jobOrder || 0,
})

const notes = ref(false)
const notesProps = reactive({
  jobOrder: store.selectedEvent.jobOrder || 0,
})
const datePicker = ref(false)

// #endregion
</script>

<template>
  <div class="w-full flex gap-3">
    <NavbarButton
      :label="t('plan-parameters.title')"
      icon="i-mdi-slider"
      :disabled="!store.selectedEvent.id"
      flat
      dense
      no-caps
      @click="planParameters = !planParameters"
    />
    <QDialog v-model="planParameters">
      <PlanParameters v-bind="planParametersProps" />
    </QDialog>

    <NavbarButton
      :label="t('plan-recipe._')"
      icon="i-mdi-flask"
      :disabled="!store.selectedEvent.id"
      flat
      dense
      no-caps
      @click="recipe = !recipe"
    />
    <QDialog v-model="recipe">
      <PlanRecipe :machine-id="recipeProps.machineId" :job-order="recipeProps.jobOrder" />
    </QDialog>

    <NavbarButton
      :label="t('batch-notes._')"
      icon="i-mdi-note-outline"
      :disabled="!store.selectedEvent.id"
      flat
      dense
      no-caps
      @click="notes = !notes"
    />
    <QDialog v-model="notes">
      <BatchNotes
        :job-order="notesProps.jobOrder"
        @update-scheduler="emit('refreshScheduler')"
      />
    </QDialog>

    <NavbarButton
      :label="t('settings._')"
      icon="i-mdi-gear"
      flat
      dense
      no-caps
      @click="settings = !settings"
    />
    <QDialog v-model="settings">
      <SettingsMain
        @update-scheduler="emit('refreshScheduler')"
        @add-column="(ev: any) => emit('addGridColumn', ev)"
        @remove-column="(ev: any) => emit('removeGridColumn', ev)"
      />
    </QDialog>

    <NavbarButton
      :label="t('date-picker._')"
      icon="i-mdi-date-range"
      flat
      dense
      no-caps
      @click="datePicker = !datePicker"
    />
    <QDialog v-model="datePicker">
      <QDate
        v-model="store.schedulerDateModel"
        range
        dark
        landscape
        @click.stop.prevent
        @range-end="emit('dateRangeEnd')"
      />
    </QDialog>

    <NavbarButton
      :description="t('zoom.in')"
      icon="i-mdi-zoom-in"
      flat
      dense
      no-caps
      @click="emit('zoom-in')"
    />
    <NavbarButton
      :description="t('zoom.out')"
      icon="i-mdi-zoom-out"
      flat
      dense
      no-caps
      @click="emit('zoom-out')"
    />
    <NavbarButton
      :description="t('zoom.reset')"
      icon="i-mdi-arrow-rotate-left"
      flat
      dense
      no-caps
      @click="emit('reset-zoom')"
    />
  </div>
</template>

<style scoped lang="postcss">
</style>
