<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RuleCredentials } from '~/shared/types'

defineEmits(['close'])
// const { data: ruleList, refresh } = await useFetch<NewMachineRuleInfo[]>('/api/machine_rule/info')
// const refactoredRuleList = computed(() => ruleList.value?.map((rule) => {
//   return {
//     id: rule.id,
//     name: rule.name,
//     departmentId: rule.departmentId,
//     machine: rule.ruleAssociations.map(item => item.machineId),
//     createdAt: rule.createdAt,
//     rule: rule.expression,
//   }
// }))
const createRule = ref(false)
const q = useQuasar()
async function deleteRule(ruleId: number, ruleName: string) {
  q.dialog({
    title: ruleName,
    message: `Delete rule ${ruleName}`,
    class: 'text-center',
    ok: {
      push: true,
      color: 'primary',
    },
    cancel: {
      push: true,
      color: 'primary',
    },
  }).onOk(async () => {
    await $fetch(`/api/machine_rule/${ruleId}`, {
      method: 'DELETE',
    })
    // refresh()
  })
}

const router = useRouter()
const filter = ref()
const { t, d } = useI18n()
onMounted(() => {
  // refresh()
})
</script>

<template>
  <div class="wrapper">
    <QTable
      :rows-per-page-options="[0]"
      no-data-label="No Data"
      :rows="[]"
      :columns="[
        { name: 'id', label: 'ID', align: 'left', field: 'id', sortable: true },
        { name: 'name', align: 'center', label: t('rule.table.name'), field: 'name', sortable: true },
        { name: 'departmentId', label: t('rule.table.department'), field: 'departmentId', sortable: true },
        { name: 'machine', label: t('rule.table.machine'), field: 'machine', sortable: true },
        { name: 'createdAt', label: t('rule.table.create'), field: 'createdAt', sortable: true, format: v => d(v, 'long') },
      ]"
      row-key="id"
      class="planning-board-table-color !text-black"
      :filter="filter"
    >
      <template #top>
        <QBtn
          label="Add New Rule"
          color="primary"
          @click="createRule = !createRule"
        />
        <QSpace />
        <QInput v-model="filter" :placeholder="t('rule.search')">
          <template #prepend>
            <q-icon name="search" />
          </template>
        </QInput>
      </template>
      <template #header="prop">
        <q-tr :props="prop">
          <q-th auto-width />
          <q-th
            v-for="col in prop.cols"
            :key="col.name"
            :props="prop"
          >
            {{ col.label }}
          </q-th>
          <q-th auto-width>
            {{ t('rule.table.delete') }}
          </q-th>
        </q-tr>
      </template>
      <template #body="prop">
        <q-tr :props="prop">
          <q-td auto-width>
            <q-btn
              size="sm"
              color="grey"
              round
              dense
              :icon="prop.expand ? 'expand_less' : 'expand_more'"
              @click="prop.expand = !prop.expand"
            />
          </q-td>
          <q-td
            v-for="col in prop.cols"
            :key="col.name"
            :props="prop"
          >
            {{ Array.isArray(col.value) ? Object.create(col.value) : col.value }}
          </q-td>
          <q-td class="flex justify-center items-center">
            <q-icon
              name="delete"
              size="30px"
              class="cursor-pointer"
              @click="deleteRule(prop.row.id, prop.row.name)"
            />
          </q-td>
        </q-tr>
        <q-tr v-show="prop.expand" :props="prop">
          <q-td colspan="100%">
            <div class="flex gap-5">
              <div
                v-for="(item, idx) in (prop.row.rule as RuleCredentials[])"
                :key="idx"
                class="flex gap-2 bg-dark-400/70 text-white justify-center items-center rounded hover:(bg-dark-400/90)"
              >
                <template v-for="(or, idy) in item.and" :key="idy">
                  <span v-if="idy > 0">{{ t('rule.and') }}</span>
                  <div class="p-3 bg-gray-400/25">
                    {{ t(`rule.not.${or.not!.value}`) }} {{ t(`rule.field.${or.field!.name}`) }} {{
                      t(`rule.operator.${or.operator!.value}`) }} '{{ Object.create(or.parameters!) }}'
                  </div>
                </template>
              </div>
            </div>
          </q-td>
        </q-tr>
      </template>
    </QTable>
  </div>
</template>

<style scoped lang="postcss">
.wrapper {
  @apply w-full max-h-200 overflow-auto p-10 border border-3 border-gray-600 rounded z-100 bg-white items-center;

  .planning-board-table-color {
    background-color: #DDDDDD;
  }
}
</style>
