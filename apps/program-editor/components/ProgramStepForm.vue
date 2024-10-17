<script lang="ts" setup>
import { Sortable } from 'sortablejs-vue3'
import type { SortableOptions } from 'sortablejs'
import ProgramStepCommandForm from './ProgramStepCommandForm.vue'
import type { ProgramStep } from '~/shared/types'
import { calculateProgramStepDuration } from '~/shared/formula'

const props = defineProps<{
  path: string
}>()

const editor = useEditorStore()
const devMode = import.meta.dev
const { t } = useI18n()
const step: ProgramStep = editor.getPathElement(props.path)
const stepIndex = computed(() => Number(props.path.split('.').pop()))
const stepIcons = computed(() => {
  const mainIcon = editor.getStepIcon(step.mainCommand.commandNo!)
  const parallelIcons = step.parallelCommands.map(({ commandNo }) => editor.getStepIcon(commandNo!))
  return [mainIcon, ...parallelIcons]
})

const expanded = ref(editor.allStepExpanded)
const expandIcon = computed(() => expanded.value ? 'expand_less' : 'expand_more')
const mainIcon = computed(() => editor.getStepIcon(step.mainCommand.commandNo!))
const parallelIcons = computed(() => step.parallelCommands.map(({ commandNo }) => editor.getStepIcon(commandNo!)))

watch(() => editor.allStepExpanded, () => {
  expanded.value = editor.allStepExpanded
})

const sortableOptions: SortableOptions = {
  sort: false,
  handle: '.__no-handle__',
  group: {
    name: 'parallel-command',
    pull: false,
    put: true,
  },
}

// Step Duration
const duration = computed(() => formatDuration(
  calculateProgramStepDuration(editor.program, editor.machine, editor.teleskopSettings.initialTemperature, stepIndex.value).duration,
))
</script>

<template>
  <div>
    <div class="flex">
      <div class="flex items-center w-5">
        <div v-show="!expanded" class="space-y-1">
          <div
            v-for="(icon, key) in stepIcons"
            :key="key"
          >
            <div v-if="icon">
              <div
                class="icon"
                :class="icon.name"
                :style="{ color: icon.color }"
              />
              <q-tooltip>
                {{ icon.name ? icon.label : t('noIcon') }}
              </q-tooltip>
            </div>
          </div>
        </div>
      </div>

      <div v-if="devMode" class="flex flex-col color-gray-5 text-3">
        <span>{{ step.stepId }}</span>
        <span>{{ duration }}</span>
      </div>

      <QBtn
        class="expand-btn"
        :icon="expandIcon"
        flat
        dense
        @click="expanded = !expanded"
      />

      <div class="w-5">
        <div v-show="expanded" class="mt-3 ml-1">
          <div v-if="mainIcon">
            <div
              class="icon"
              :class="mainIcon.name"
              :style="{ color: mainIcon.color }"
            />
            <q-tooltip>
              {{ mainIcon.name ? mainIcon.label : t('noIcon') }}
            </q-tooltip>
          </div>
        </div>
      </div>

      <ProgramStepCommandForm
        class="flex-1"
        :path="`${props.path}.mainCommand`"
      />
    </div>
    <div v-show="expanded" class="e-border-color border-(t x-0) mt-2px pl-16">
      <Sortable
        :list="step.parallelCommands"
        item-key="commandId"
        :options="sortableOptions"
        class="parallel-commands"
        :data-index="stepIndex"
      >
        <template #header>
          <span
            v-if="step.parallelCommands.length === 0"
            class="py-10 inline-block e-text-dim"
          >{{ t('noParallelStep') }}</span>
        </template>
        <template #item="{ index }">
          <div
            class="step-parallel-command"
            :class="{ __selected: editor.selectedSteps.find(step => step.stepId === stepIndex) && editor.selectedParallelStep === index }"
          >
            <div v-if="devMode" class="flex flex-col color-gray-5 text-3">
              <span>{{ step.parallelCommands[index].commandId }}</span>
            </div>
            <div class="w-5">
              <div v-if="parallelIcons[index]?.name">
                <div
                  class="icon"
                  :class="parallelIcons[index]?.name"
                  :style="{ color: parallelIcons[index]?.color }"
                />
                <q-tooltip>
                  {{ parallelIcons[index]?.label }}
                </q-tooltip>
              </div>
            </div>

            <div>
              <ProgramStepCommandForm :path="`${props.path}.parallelCommands.${index}`" :expanded />
            </div>
            <QSpace />
            <QBtn
              class="delete-btn"
              icon="close"
              flat
              dense
              @click="editor.deleteParallelStep(stepIndex, index)"
            />
          </div>
        </template>
      </Sortable>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.step-parallel-command {
  @apply flex flex-row items-center w-full pl-4;
  @apply border-b border-black border-opacity-20;
  @apply dark:(border-b border-white border-opacity-20);
}

.step-parallel-command:last-child {
  @apply border-none;
}

.step-parallel-command:hover {
  background-color: #d1e4fa;

  .delete-btn {
    @apply !text-(black opacity-60) !dark:(text-(white opacity-60));
  }
}

.step-parallel-command.__selected {
  @apply bg-blue-2 dark:bg-dark-1;
}

.expand-btn {
  @apply !text-(black opacity-60) !dark:(text-(white opacity-60));
}

.delete-btn {
  @apply !text-(black opacity-0) !dark:(text-(white opacity-0));
}

.icon {
  @apply text-18px mr-4px cursor-pointer;
}
</style>
