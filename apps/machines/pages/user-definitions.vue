<script setup lang="ts">
import type { User } from '~/types'

const { t } = useI18n()
const kc = useKeycloak()
const userTypeOptions = [{ label: t('Operator'), value: 1 }, { label: t('other'), value: 2 }]

const columns = computed(() => ({
  userId: {
    label: t('userId'),
    field: 'userId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    unique: true,
    type: 'number',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required|min:0',
    },
  },
  userName: {
    name: 'userName',
    label: t('userName'),
    field: 'userName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required|length:3',
    },
  },
  userSurname: {
    label: t('userSurname'),
    field: 'userSurname',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required|length:3',
    },
  },
  userPass: {
    label: t('userPassword'),
    field: 'userPass',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'text',
    visible: true,
    editable: true,
    schema: {
      filled: true,
      validation: 'required|length:4,12|notStartsWithZero',
    },
  },
  userActive: {
    label: t('active'),
    field: 'userActive',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'checkbox',
    visible: true,
    editable: true,
    format: (val: boolean) => val ? t('yes') : t('no'),
    schema: {
      filled: true,
      validation: 'required',
    },
  },
  userInfo: {
    label: t('userInfo'),
    field: 'userInfo',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'textarea',
    visible: false,
    editable: true,
    schema: {
      filled: true,
    },
  },
  userType: {
    label: t('userType'),
    field: 'userType',
    align: 'left',
    filterable: true,
    filterType: 'includes',
    type: 'select',
    visible: true,
    editable: true,
    format: (val: number) => userTypeOptions.find(d => d.value === val) ? userTypeOptions.find(d => d.value === val)?.label : val,
    schema: {
      validation: 'required',
      options: userTypeOptions,
    },
  },
}))

const { data: users, refresh } = useAuthFetch('/api/user-definitions/user-definitions', {
  default: () => [],
  method: 'POST',
  body: {},
})

const showPermissionsDialog = ref(false)
const selected = ref<Partial<User>>({
  userId: -1,
  userName: '',
  userSurname: '',
  userPass: '',
  userInfo: '',
  userActive: 0,
  userType: -1,
  userMode: '',
  userMode2: '',
})

async function handleAdd(formData: Partial<User>) {
  formData.userMode = selected.value.userMode
  formData.userMode2 = selected.value.userMode2
  await kc.fetch('/api/user-definitions/user-definition', {
    method: 'POST',
    body: formData,
  })
  await refresh()
}

async function handleEdit(formData: Partial<User>) {
  formData.userMode = selected.value.userMode
  formData.userMode2 = selected.value.userMode2
  await kc.fetch('/api/user-definitions/user-definition', {
    method: 'PUT',
    body:
      formData,
  })
  await refresh()
}

async function handleDelete(formData: Partial<User>[]) {
  await kc.fetch('/api/user-definitions/user-definition', {
    method: 'DELETE',
    body: {
      userIds: formData.map(d => d.userId),
    },
  })
  await refresh()
}

async function handleSelect(formData: Partial<User>[]) {
  selected.value = formData[0]
}
</script>

<template>
  <div>
    <FormTableKit
      :rows="users"
      :columns="columns"
      form-class="grid grid-cols-2 grid-rows-4 gap-4 items-center w-120 h-160"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @select="handleSelect"
    >
      <template #form-content>
        <q-btn
          :label="t('permissions')"
          color="primary"
          no-caps
          class="row-start-5"
          @click="showPermissionsDialog = true"
        />
      </template>
    </FormTableKit>
    <UserPermissionsDialog
      :show="showPermissionsDialog"
      :selected="selected"
      @close="showPermissionsDialog = false"
    />
  </div>
</template>
