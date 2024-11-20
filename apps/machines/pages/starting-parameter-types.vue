<script setup lang="ts">
import { klona } from 'klona'
import type { IContextMenuOption } from '~/components/ContextMenu.vue'
import type { StartingParameter } from '~/types'

const { t } = useI18n()
const kc = useKeycloak()
const selectedMachineId = ref()

interface ParamTypeMap {
  id: number
  name: string
  data: StartingParameter | null
}

const paramTypeMaps = reactive<ParamTypeMap[]>([
  { id: 0, data: null, name: 'fabricWeight' },
  { id: 1, data: null, name: 'flotteRatio' },
  { id: 2, data: null, name: 'partCount' },
  { id: 3, data: null, name: 'partyNo' },
  { id: 4, data: null, name: 'accompanyNo' },
  { id: 5, data: null, name: 'clothLength' },
  { id: 6, data: null, name: 'customer' },
  { id: 7, data: null, name: 'customerOrder' },
  { id: 8, data: null, name: 'fabricType' },
])

const { data: machines } = useAuthFetch('/api/machines/active-machines')

const { data: parameterOptions } = useAuthFetch('/api/starting-parameter-types/starting-parameters', {
  query: { machineId: selectedMachineId },
  immediate: false,
  transform: (parameterOptions) => {
    parameterOptions.unshift({
      paramId: -1,
      paramString: t('notSelected'),
    })
    return parameterOptions as readonly StartingParameter[]
  },
})

const { data: parameterTypes } = useAuthFetch('/api/starting-parameter-types/starting-parameter-types', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

watch(parameterTypes, (_newValue, _oldValue) => {
  for (const paramTypeMap of paramTypeMaps) {
    paramTypeMap.data = parameterTypes.value?.find(t => t.paramTypeId === Number(paramTypeMap.id)) || { paramId: -1, paramString: t('notSelected') }
  }
})

interface ParamType {
  id: number
  paramId: number
  machineId: number
}

const changedParameterTypes = ref<ParamType[]>([])

function handleOptionChange(paramType: ParamTypeMap) {
  if (paramType.data) {
    changedParameterTypes.value.push({ id: paramType.id, paramId: paramType.data.paramId, machineId: selectedMachineId.value })
  }
}

async function handleSubmit() {
  await kc.fetch('/api/starting-parameter-types/starting-parameter-types', {
    method: 'PUT',
    body: { changedParameterTypes: changedParameterTypes.value },
  })
  changedParameterTypes.value = []
}

const copy = ref()

const contextMenuOptions = computed(() => [
  {
    label: t('copy'),
    category: 'copy',
    keybind: '',
    icon: 'content_copy',
    disabled: !selectedMachineId.value,
    onClick: () => {
      copy.value = klona(paramTypeMaps)
    },
  },
  {
    label: t('paste'),
    category: 'copy',
    keybind: '',
    icon: 'content_paste',
    disabled: !selectedMachineId.value || !copy.value,
    onClick: async () => {
      for (const paramType of copy.value) {
        handleOptionChange(paramType)
      }
      await handleSubmit()
    },
  },
])
</script>

<template>
  <div>
    <ContextMenu
      :context-menu-options="contextMenuOptions"
      target=".q-list"
      @click="(option: IContextMenuOption) => option.onClick(selectedMachineId)"
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
              @click="selectedMachineId = machine.machineId"
            >
              <q-item-section>
                {{ machine.machineCode }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-if="parameterOptions" class="flex flex-col input-field">
          <div v-for="paramTypeMap in paramTypeMaps" :key="paramTypeMap.id">
            <q-select
              v-model="paramTypeMap.data"
              :options="parameterOptions"
              option-label="paramString"
              option-value="paramId"
              :label="t(paramTypeMap.name)"
              @update:model-value="handleOptionChange(paramTypeMap)"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="mt-4 mr-4">
        <q-btn
          no-caps
          :label="t('cancel')"
          @click="$router.go(0)"
        />
        <q-btn
          color="primary"
          no-caps
          :label="t('submit')"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<style scoped>
.input-field > * {
  min-width: 20em;
  margin-bottom: 1em;
}
</style>
