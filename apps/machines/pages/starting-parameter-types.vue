<script setup lang="ts">
import { klona } from 'klona'
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

const { data: allParameterOptions } = useAuthFetch('/api/starting-parameter-types/starting-parameters', {
  query: { machineId: selectedMachineId },
  immediate: false,
  transform: (parameterOptions) => {
    const transformedOptions = parameterOptions.map((option: StartingParameter) => ({
      ...option,
      paramString: option.paramString || t('notSelected'),
    }))

    transformedOptions.unshift({
      paramId: -1,
      paramString: t('notSelected'),
    })
    return transformedOptions as readonly StartingParameter[]
  },
})

const availableOptionsForParamType = computed(() => {
  const optionsMap: Record<number, StartingParameter[]> = {}

  for (const paramTypeMap of paramTypeMaps) {
    if (!allParameterOptions.value) {
      optionsMap[paramTypeMap.id] = []
      continue
    }

    const selectedParamIds = paramTypeMaps
      .filter(map => map.id !== paramTypeMap.id && map.data && map.data.paramId !== -1)
      .map(map => map.data!.paramId)

    optionsMap[paramTypeMap.id] = allParameterOptions.value.filter(option =>
      option.paramId === -1 || !selectedParamIds.includes(option.paramId),
    )
  }

  return optionsMap
})

const { data: parameterTypes } = useAuthFetch('/api/starting-parameter-types/starting-parameter-types', {
  immediate: false,
  query: { machineId: selectedMachineId },
})

interface ParamType {
  id: number
  paramId: number
  machineId: number
}

const changedParameterTypes = ref<ParamType[]>([])

watch(parameterTypes, (_newValue, _oldValue) => {
  changedParameterTypes.value = []

  for (const paramTypeMap of paramTypeMaps) {
    const foundParam = parameterTypes.value?.find(t => t.paramTypeId === Number(paramTypeMap.id))
    if (foundParam) {
      paramTypeMap.data = {
        ...foundParam,
        paramString: foundParam.paramString || t('notSelected'),
      }
    } else {
      paramTypeMap.data = { paramId: -1, paramString: t('notSelected') }
    }
  }
})

watch(selectedMachineId, () => {
  changedParameterTypes.value = []
})
const { notifySuccess, notifyError } = useNotify()

const hasChanges = computed(() => changedParameterTypes.value.length > 0)

function handleOptionChange(paramType: ParamTypeMap) {
  if (paramType.data) {
    changedParameterTypes.value.push({ id: paramType.id, paramId: paramType.data.paramId, machineId: selectedMachineId.value })
  }
}

async function handleSubmit() {
  try {
    const response = await kc.fetch('/api/starting-parameter-types/starting-parameter-types', {
      method: 'PUT',
      body: { changedParameterTypes: changedParameterTypes.value },
    }) as { message?: string }

    if (response?.message) {
      notifySuccess(t(response.message) || t('successfullySaved'))
    } else {
      notifySuccess(t('successfullySaved'))
    }

    changedParameterTypes.value = []
  } catch (error) {
    notifyError(t('errorOccurred'))
    console.error('Error saving parameter types:', error)
  }
}

function handleCancel() {
  changedParameterTypes.value = []
  for (const paramTypeMap of paramTypeMaps) {
    const originalParam = parameterTypes.value?.find(t => t.paramTypeId === Number(paramTypeMap.id))
    if (originalParam) {
      paramTypeMap.data = {
        ...originalParam,
        paramString: originalParam.paramString || t('notSelected'),
      }
    } else {
      paramTypeMap.data = { paramId: -1, paramString: t('notSelected') }
    }
  }
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
      changedParameterTypes.value = []

      for (const paramTypeMap of paramTypeMaps) {
        const copiedParam = copy.value.find((cp: ParamTypeMap) => cp.id === paramTypeMap.id)

        if (copiedParam && copiedParam.data && copiedParam.data.paramId !== -1) {
          const availableParam = allParameterOptions.value?.find(
            option => option.paramId === copiedParam.data.paramId,
          )

          if (availableParam) {
            paramTypeMap.data = {
              ...availableParam,
              paramString: availableParam.paramString || t('notSelected'),
            }
          } else {
            paramTypeMap.data = { paramId: -1, paramString: t('notSelected') }
          }
        } else {
          paramTypeMap.data = { paramId: -1, paramString: t('notSelected') }
        }

        handleOptionChange(paramTypeMap)
      }

      await handleSubmit()
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
              @click="selectedMachineId = machine.machineId"
            >
              <q-item-section>
                {{ machine.machineCode }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-if="allParameterOptions" class="flex flex-col input-field">
          <div v-for="paramTypeMap in paramTypeMaps" :key="paramTypeMap.id">
            <q-select
              v-model="paramTypeMap.data"
              :options="availableOptionsForParamType[paramTypeMap.id] || []"
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
          :disabled="!hasChanges"
          @click="handleCancel"
        />
        <q-btn
          color="primary"
          no-caps
          :label="t('submit')"
          :disabled="!hasChanges"
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
