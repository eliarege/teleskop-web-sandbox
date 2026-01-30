<script setup lang="ts">
import type { ParameterItem } from '~/shared/types'

const props = defineProps<{
  type: 'add' | 'remove' | 'changeParameter'
  commandNo: number
  commandName: string
  stepIndex: number
  stepsLength: number
  parameter?: ParameterItem
  oldValue?: number | string
}>()

defineEmits([...useDialogPluginComponent.emits])

const { t } = useI18n()
const machine = useMachineStore()
const { mt } = useProjectTranslations()
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent()

const commandName = computed(() => mt(props.commandName, machine.currentMachine.id))

const startIndex = ref(props.stepIndex + 1)
const endIndex = ref(props.stepsLength)

const stepOptions = computed(() =>
  Array.from({ length: props.stepsLength - startIndex.value + 1 }, (_, i) => startIndex.value + i),
)

const commandIcon = computed(() => machine.getCommandIcon(props.commandNo))
const commandParameter = computed(() => machine.currentMachine.commands.get(props.commandNo)?.parameters.find(p => p.index === props.parameter!.index))
const parameterFormat = computed(() => commandParameter.value?.format || '')

const parameterName = computed(() => {
  if (!props.parameter)
    return ''
  const parameter = machine.currentMachine.commands.get(props.commandNo)?.parameters.find(p => p.index === props.parameter!.index)
  return parameter ? mt(parameter.name, machine.currentMachine.id) : ''
})

const isChangeParameter = computed(() => props.type === 'changeParameter' && props.parameter)

const isValidRange = computed(() => startIndex.value <= endIndex.value)

function onOk() {
  if (!isValidRange.value)
    return

  onDialogOK({
    type: props.type,
    commandNo: props.commandNo,
    startIndex: startIndex.value - 1,
    endIndex: endIndex.value - 1,
  })
}
</script>

<template>
  <q-dialog
    ref="dialogRef"
    class="select-none"
    @hide="onDialogHide"
    @keydown.enter.prevent="onOk"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6 flex">
          {{ t(`moveParallelStep.${props.type}.title`) }}
          <q-space />
          <q-btn
            v-close-popup
            class="text-gray-4 dark:text-gray-6"
            icon="close"
            flat
            round
            dense
          />
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Command Info -->
          <div class="col-12">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-auto">
                <span
                  v-if="commandIcon"
                  :class="commandIcon.name"
                  :style="{ color: commandIcon.color }"
                  class="text-lg"
                />
              </div>
              <div class="col">
                <div class="text-caption text-grey">
                  {{ t('command.commandNo') }}
                </div>
                <div class="text-body2">
                  {{ props.commandNo }}
                </div>
              </div>
              <div class="col">
                <div class="text-caption text-grey">
                  {{ t('command.name') }}
                </div>
                <div class="text-body2">
                  <TruncatedText
                    :text="commandName"
                    :max-length="30"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Parameter Info (only for changeParameter) -->
          <template v-if="isChangeParameter">
            <div class="col-12">
              <q-separator />
            </div>
            <div class="col-4">
              <div class="text-caption text-grey">
                {{ t('moveParallelStep.changeParameter.parameter.name') }}
              </div>
              <div class="text-body2">
                <TruncatedText
                  :text="parameterName"
                  :max-length="30"
                />
              </div>
            </div>
            <div class="col-4">
              <div class="text-caption text-grey">
                {{ t('moveParallelStep.changeParameter.parameter.oldValue') }}
              </div>
              <div class="text-body2">
                <div v-if="parameterFormat === 'DURATION'">
                  <span v-if="typeof props.oldValue === 'number'">
                    {{ formatDuration(props.oldValue, true) }}
                  </span>
                </div>
                <div v-else>
                  {{ props.oldValue }}
                </div>
              </div>
            </div>
            <div class="col-4">
              <div class="text-caption text-grey">
                {{ t('moveParallelStep.changeParameter.parameter.newValue') }}
              </div>
              <div class="text-body2 text-primary">
                <div v-if="parameterFormat === 'DURATION'">
                  <span v-if="typeof props.parameter!.value === 'number'">
                    {{ formatDuration(props.parameter!.value, true) }}
                  </span>
                </div>
                <div v-else>
                  {{ props.parameter!.value }}
                </div>
              </div>
            </div>
          </template>

          <!-- Step Range -->
          <div class="col-12">
            <q-separator />
          </div>
          <div class="col-6">
            <q-select
              v-model="startIndex"
              :options="stepOptions"
              :label="t('moveParallelStep.startIndex')"
              outlined
              dense
              options-dense
              :rules="[
                (val: number) => !!val || t('input.required', { field: t('moveParallelStep.startIndex') }),
                (val: number) => val <= endIndex || t('moveParallelStep.startIndexMore'),
              ]"
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="endIndex"
              :options="stepOptions"
              :label="t('moveParallelStep.endIndex')"
              outlined
              dense
              options-dense
              :rules="[
                (val: number) => !!val || t('input.required', { field: t('moveParallelStep.endIndex') }),
                (val: number) => val >= startIndex || t('moveParallelStep.endIndexLess'),
              ]"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions
        align="right"
        class="q-pa-md bg-gray-1 dark:bg-dark-4"
      >
        <q-btn
          v-close-popup
          class="q-mr-sm bg-gray-2 dark:bg-dark-3 text-dark-4 dark:text-gray-4"
          :label="t('cancel')"
          flat
        />
        <q-btn
          :label="t(`moveParallelStep.${props.type}.operate`)"
          :color="props.type === 'remove' ? 'negative' : 'primary'"
          :disable="!isValidRange"
          unelevated
          @click="onOk"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
