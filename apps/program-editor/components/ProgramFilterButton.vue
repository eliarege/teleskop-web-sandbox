<script setup lang="ts">
const { t } = useI18n()
const editor = useEditorStore()
const filter = useProgramFilterStore()
const inputId = useId()

function focusNumberInput() {
  document.getElementById(inputId)?.focus()
}
</script>

<template>
  <div>
    <TopbarButton
      :color="filter.hasFilter() ? 'red-6' : 'gray-6'"
      icon="filter_alt"
      rounded
    >
      <QTooltip class="text-capitalize">
        {{ t('filter.programFilter') }}
      </QTooltip>

      <QMenu
        v-model="filter.showFilterPopup"
        transition-show="scale"
        transition-hide="scale"
        anchor="bottom right"
        self="top right"
        class="rounded-md"
        :transition-duration="0"
        @show="focusNumberInput"
      >
        <div class="q-pa-sm select-none" style="width: 350px;">
          <div class="text-4 flex items-center">
            <span class="text-gray-8 ml-2">{{ t('filter.programFilter') }}</span>
            <QSpace />
            <QBtn
              class="text-gray-6 mr-2"
              icon="delete"
              size="md"
              round
              dense
              flat
              @click="filter.clearFilter()"
            >
              <QTooltip>{{ t('filter.delete_all') }}</QTooltip>
            </QBtn>
            <QBtn
              class="text-gray-8"
              icon="close"
              size="md"
              round
              dense
              flat
              @click="filter.showFilterPopup = false"
            >
              <QTooltip>{{ t('filter.close') }}</QTooltip>
            </QBtn>
          </div>

          <QSeparator class="q-my-sm" />

          <div class="q-pa-sm column q-gutter-y-md">
            <InputNumber
              :id="inputId"
              v-model="filter.existingFilter.programNo"
              :label="t('filter.programNo')"
              hide-bottom-space
              maybe-empty
              dense
            />
            <QInput
              v-model="filter.existingFilter.programName"
              :label="t('filter.programName')"
              dense
            />
            <QSelect
              v-model="filter.existingFilter.processType"
              :options="editor.allProcessTypes"
              :label="t('filter.processType')"
              options-dense
              dense
              clearable
            />
            <QCheckbox
              v-model="filter.existingFilter.clearOnChange"
              :label="t('filter.clearFilterOnChange')"
              dense
            />
          </div>
        </div>
      </QMenu>
    </TopbarButton>
  </div>
</template>
