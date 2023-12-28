<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type {
  AndBlock,
  Field,
  MachineRule,
  Operator,
  OrBlock,
  RuleCondition,
  ValueType,
} from '~/shared/types'

const emits = defineEmits(['close', 'submit'])
const { t } = useI18n()

const condition: RuleCondition[] = [
  { value: true, label: t('rule.not.true') },
  { value: false, label: t('rule.not.false') },
]

type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>

const machineRule: PartialExcept<MachineRule, 'name' | 'machines'> = reactive({
  name: '',
  machines: {
    id: 0,
    name: '',
  },
  rule: {
    or: [
      {
        and: [
          {
            not: undefined,
            field: undefined,
            operator: undefined,
            parameters: [''],
          },
        ],
      },
    ],
  },
})

function isValidAndBlock(and: AndBlock) {
  if (and.not && and.field && and.operator && and.parameters?.some(a => a !== '')) {
    return true
  }
  return false
}

function isValidOrBlock(orBlock: OrBlock) {
  if (orBlock.and.length > 0) {
    for (const andBlock of orBlock.and) {
      if (!isValidAndBlock(andBlock)) {
        return false
      }
    }
    return true
  }
  return false
}

function isValidMachineRule(rule: PartialExcept<MachineRule, 'name' | 'machines'>) {
  if (
    rule.name !== ''
    && rule.department
    && rule.machines.id > 0
    && rule.rule!.or.length > 0
  ) {
    for (const orBlock of rule.rule!.or) {
      if (!isValidOrBlock(orBlock)) {
        return false
      }
    }
    return true
  }
  return false
}

const { data: machines } = await useFetch('/api/machineList')
function addAndRow(orId: number) {
  machineRule.rule!.or[orId].and.push(
    {
      not: undefined,
      field: undefined,
      operator: undefined,
      parameters: [],
    },
  )
}

function removeAndRow(orId: number, andId: number) {
  machineRule.rule!.or[orId].and.splice(andId, 1)
}
function removeOrRow() {
  machineRule.rule?.or.pop()
}
function addOrRow() {
  machineRule.rule!.or.push(
    {
      and: [
        {
          not: undefined,
          field: undefined,
          operator: undefined,
          parameters: [],
        },
      ],
    },
  )
}

async function onSubmit() {
  const obj = [
    {
      name: machineRule.name,
      department_id: machineRule.department!.id,
      expression: machineRule.rule!.or,
    },
    machineRule.machines.id,
  ]
  await $fetch('/api/machineRule', {
    method: 'POST',
    body: obj,
  })
  emits('close')
}
const { data: operator } = useFetch<Operator[]>('/api/machine_rule/operator')
const { data: fabricType } = useFetch<{ id: number; label: string }[]>('/api/machine_rule/fabric_type')
const fields = ref([] as Field[])
watch(() => machineRule.machines.id, () => {
  fetchFields(machineRule.machines.id)
})
async function fetchFields(machineId: number) {
  const res = await $fetch<Field[]>('/api/machine_rule/field', {
    query: { machineId },
  })
  return fields.value = res
}

function conditionalOperators(type: ValueType) {
  const op = operator.value?.map((op) => {
    return {
      name: t(`rule.operator.${op.name}`),
      value: op.name,
      type: op.type,
      parameters: op.parameters,
    }
  })
  return op?.filter(a => a.type.includes(type))
}
</script>

<template>
  <div class="wrapper cursor-default">
    <div class="select-items">
      <div class="select-items-head">
        <QInput
          v-model="machineRule.name"
          class="w-1/3"
          filled
          :label="t('rule.main.name')"
        />
        <QSelect
          v-model="machineRule.machines"
          class="w-1/3"
          :label="t('rule.main.machine')"
          filled
          option-label="name"
          :options="machines"
        />
      </div>
      <div
        v-for="(orItem, orId) in machineRule.rule!.or"
        :key="orId"
        class="bg-gray-500/10 rounded-2xl"
      >
        <div
          v-for="(andItem, andId) in orItem.and"
          :key="andId"
          class="h-full w-full gap-3 flex flex-1 justify-center items-center m-3"
        >
          <div class="select-items-body">
            <QSelect
              v-model="andItem.not"
              :options="condition"
              :label="t('rule.main.condition')"
            />
            <QSelect
              v-if="machineRule.machines.id > 0"
              v-model="andItem.field"
              :options="fields"
              :label="t('rule.main.field')"
            />
            <QSelect
              v-if="andItem.field"
              v-model="andItem.operator"
              :options="conditionalOperators(andItem.field.type)"
              :option-value="andItem.operator?.name"
              map-options
              option-label="name"
              :label="t('rule.main.op')"
            />
            <div v-if="andItem.operator" class="w-full gap-3 inline-flex">
              <div
                v-for="(param, paramId) in andItem.operator.parameters"
                :key="paramId"
                class="w-full"
              >
                <div v-if="andItem.field?.type === 'values'">
                  <QSelect
                    v-model="andItem.parameters![paramId]"
                    :options="fabricType || []"
                    emit-value
                    map-options
                  />
                </div>
                <div v-else>
                  <QInput
                    v-if="andItem.field!.type === 'number'"
                    v-model="andItem.parameters![paramId]"
                    mask="##################"
                  />
                  <QInput
                    v-else
                    v-model="andItem.parameters![paramId]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-3 justify-center items-center h-full">
            <QBtn
              v-if="orItem.and.length > 1"
              icon="delete"
              @click="removeAndRow(orId, andId)"
            >
              <QTooltip>
                {{ t('rule.delete') }}
              </QTooltip>
            </QBtn>
            <QBtn icon="add" @click="addAndRow(orId)">
              <QTooltip>
                {{ t('rule.and') }}
              </QTooltip>
            </QBtn>
          </div>
        </div>
      </div>
      <div class="splitter" />
      <div class="select-item-bottom">
        <QBtn icon="add" @click="addOrRow">
          <QTooltip>{{ t('rule.or') }}</QTooltip>
        </QBtn>
        <QBtn
          v-if="machineRule.rule!.or.length > 1"
          icon="delete"
          @click="removeOrRow"
        >
          <QTooltip>{{ t('rule.or') }}</QTooltip>
        </QBtn>
        <QSpace />
        <QBtn
          :label="t('rule.submit')"
          :disable="!isValidMachineRule(machineRule)"
          @click="onSubmit"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  @apply w-screen max-h-200 overflow-auto p-10 border border-3 border-gray-600 rounded z-100 bg-white items-center;

.select-items {
    @apply w-full h-full flex flex-col gap-5;
  .select-items-head {
    @apply w-full h-full flex flex-1 gap-3;
  }
  .select-items-body {
    grid-template-columns: 1fr 1fr 1fr 2fr;
    @apply w-9/10 h-full grid gap-5 ;
  }
  .select-item-bottom {
    @apply w-full h-full flex gap-3;
  }
}
}
.splitter {
  @apply w-full h-1px border border-gray-400/50 m-2;
}
</style>
