<script setup lang="ts">
import { useUnsavedDialogGuard } from '~/composables/useUnsavedDialogGuard'

interface ConsumptionCounter {
  machineId: number
  counterId1: number
  counterId2: number
}

interface CounterOption {
  id: number
  name: string
}

const kc = useKeycloak()
const router = useRouter()
const { t } = useI18n()
const { notifyError, notifySuccess } = useNotify()
const selectedMachineId = ref()

const counter1 = ref()
const counter2 = ref()
const originalCounter1 = ref()
const originalCounter2 = ref()

const changedCounters = ref<ConsumptionCounter[]>([])
const isSaving = ref(false)

const {
  confirmVisible,
  confirmDiscard,
  keepEditing,
  markSaved,
} = useUnsavedDialogGuard<ConsumptionCounter[]>({
  getState: () => changedCounters.value.map(counter => ({ ...counter })),
  setState: (state) => {
    changedCounters.value = (state ?? []).map(counter => ({ ...counter }))
  },
  isOpen: () => true,
  router,
  enableBeforeUnload: true,
})

const { data: machines } = useAuthFetch('/api/machines/active-machines')

const { data: allCounterOptions, refresh: refreshCounterOptions } = useAuthFetch('/api/consumption-counters/mach-counters', {
  immediate: false,
  query: { machineId: selectedMachineId },
  transform: (counterOptions) => {
    const options = [...counterOptions]
    options.unshift({
      id: -1,
      name: t('notSelected'),
    })
    return options as readonly CounterOption[]
  },
})

const counter1Options = computed(() => {
  if (!allCounterOptions.value)
    return []
  if (!counter2.value || counter2.value.id === -1)
    return allCounterOptions.value
  return allCounterOptions.value.filter(option => option.id === -1 || option.id !== counter2.value.id)
})

const counter2Options = computed(() => {
  if (!allCounterOptions.value)
    return []
  if (!counter1.value || counter1.value.id === -1)
    return allCounterOptions.value
  return allCounterOptions.value.filter(option => option.id === -1 || option.id !== counter1.value.id)
})

const { data: counters, refresh: refreshCounters } = useAuthFetch('/api/consumption-counters/consumption-counter', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

const hasChanges = computed(() => {
  if (!counter1.value || !counter2.value || !originalCounter1.value || !originalCounter2.value) {
    return false
  }
  return counter1.value.id !== originalCounter1.value.id || counter2.value.id !== originalCounter2.value.id
})

watch(counters, (_newValue, _oldValue) => {
  if (allCounterOptions.value && allCounterOptions.value.length && counters.value) {
    const notSelectedOption = allCounterOptions.value.find(option => option.id === -1)

    counter1.value = allCounterOptions.value.find(option => option.id === counters.value.counter1) || notSelectedOption
    counter2.value = allCounterOptions.value.find(option => option.id === counters.value.counter2) || notSelectedOption

    originalCounter1.value = counter1.value
    originalCounter2.value = counter2.value
  } else {
    const notSelectedOption = allCounterOptions.value?.find(option => option.id === -1)
    counter1.value = notSelectedOption || null
    counter2.value = notSelectedOption || null
    originalCounter1.value = counter1.value
    originalCounter2.value = counter2.value
  }
})

async function handleMachineClick(machineId: number) {
  selectedMachineId.value = machineId
  await refreshCounterOptions()
  await refreshCounters()
}

function handleOptionChange() {
  if (!selectedMachineId.value || !counter1.value || !counter2.value)
    return

  if (counter1.value.id !== -1 && counter2.value.id !== -1 && counter1.value.id === counter2.value.id) {
    notifyError(t('error.same_counter_selected'))
    counter1.value = originalCounter1.value
    counter2.value = originalCounter2.value
    return
  }

  changedCounters.value = changedCounters.value.filter(c => c.machineId !== selectedMachineId.value)

  if (hasChanges.value) {
    changedCounters.value.push({
      machineId: selectedMachineId.value,
      counterId1: counter1.value.id,
      counterId2: counter2.value.id,
    })
  }
}

async function handleSubmit() {
  if (changedCounters.value.length === 0)
    return true

  isSaving.value = true

  try {
    const result = await kc.fetch('/api/consumption-counters/consumption-counters', {
      method: 'PUT',
      body: { changedCounters: changedCounters.value },
    })

    if (result.message) {
      notifySuccess(t(`success.${result.message}`))
    } else {
      notifySuccess(t('success.operation_completed'))
    }

    changedCounters.value = []

    originalCounter1.value = counter1.value
    originalCounter2.value = counter2.value

    await refreshCounterOptions()
    markSaved()
    return true
  } catch (error: any) {
    const errorMessage = error.data?.statusMessage || error.statusMessage || error.message || 'unknown'
    notifyError(t(`error.${errorMessage}`))
    return false
  } finally {
    isSaving.value = false
  }
}

function handleCancel() {
  counter1.value = originalCounter1.value
  counter2.value = originalCounter2.value

  changedCounters.value = changedCounters.value.filter(c => c.machineId !== selectedMachineId.value)
}

function leaveWithoutSaving() {
  confirmDiscard()
}

async function saveAndLeave() {
  const success = await handleSubmit()
  if (!success)
    return
  markSaved()
  confirmDiscard()
}

const copy = ref()

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: !selectedMachineId.value || !counter1.value || !counter2.value,
    onClick: () => {
      copy.value = { counter1: counter1.value, counter2: counter2.value }
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      if (allCounterOptions.value && copy.value) {
        const copiedCounter1 = allCounterOptions.value.find(option => option.id === copy.value.counter1.id)
        const copiedCounter2 = allCounterOptions.value.find(option => option.id === copy.value.counter2.id)

        if (copiedCounter1 && copiedCounter2 && copy.value.counter1.id !== copy.value.counter2.id) {
          counter1.value = copiedCounter1
          counter2.value = copiedCounter2
          handleOptionChange()
        } else {
          notifyError(t('error.counter_not_available'))
        }
      }
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :options="contextMenuOptions"
      target=".q-list"
      @click="option => option.onClick(selectedMachineId)"
    />
    <q-card>
      <q-card-section class="flex flex-row justify-center gap-8">
        <div class="w-sm">
          <h3>{{ t('machines') }}</h3>
          <q-list
            bordered
            separator
            class="overflow-y-auto h-140"
          >
            <q-item
              v-for="machine in machines"
              :key="machine.machineId"
              v-ripple
              clickable
              :active="selectedMachineId === machine.machineId"
              :focused="selectedMachineId === machine.machineId"
              @click="handleMachineClick(machine.machineId)"
            >
              <q-item-section>
                {{ machine.machineCode }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-if="allCounterOptions" class="flex flex-col input-field">
          <q-select
            v-model="counter1"
            :options="counter1Options"
            option-label="name"
            option-value="id"
            :label="`${t('counter')} 1`"
            @update:model-value="handleOptionChange()"
          />
          <q-select
            v-model="counter2"
            :options="counter2Options"
            option-label="name"
            option-value="id"
            :label="`${t('counter')} 2`"
            @update:model-value="handleOptionChange()"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="mt-4 mr-4">
        <q-btn
          no-caps
          :label="t('cancel')"
          :disabled="!hasChanges"
          @click="handleCancel"
        />
        <q-btn
          color="primary"
          no-caps
          :label="t('submit')"
          :disabled="!hasChanges"
          :loading="isSaving"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </div>

  <q-dialog
    v-model="confirmVisible"
    persistent
  >
    <q-card style="min-width: 420px">
      <q-card-section>
        <div class="text-h6">
          {{ t('unsavedChanges.title') }}
        </div>
        <div class="text-body2 q-mt-sm">
          {{ t('unsavedChanges.message') }}
        </div>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          :label="t('cancel')"
          @click="keepEditing"
        />
        <q-btn
          flat
          color="negative"
          :label="t('unsavedChanges.discard')"
          @click="leaveWithoutSaving"
        />
        <q-btn
          color="primary"
          :label="t('submit')"
          :loading="isSaving"
          @click="saveAndLeave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.input-field > * {
  min-width: 20em;
  margin-bottom: 1em;
}
</style>
