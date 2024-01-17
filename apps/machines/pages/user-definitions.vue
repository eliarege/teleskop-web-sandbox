<script setup lang="ts">
import FilterableTable from 'ui/components/FilterableTable.vue'
import type { Column } from 'ui/types/FilterableTable'
import type { User } from '~/types'
import { addUser, deleteUser, editUser } from '~/utils'

const columns: Column[] = [
  {
    name: 'userId',
    label: 'Kullanıcı No',
    field: 'userId',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'userName',
    label: 'İsim',
    field: 'userName',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },
  {
    name: 'userSurname',
    label: 'Soyisim',
    field: 'userSurname',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'userPass',
    label: 'Kullanıcı Şifresi',
    field: 'userPass',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'userActive',
    label: 'Aktif',
    field: 'userActive',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

  {
    name: 'userType',
    label: 'Kullanıcı Tipi',
    field: 'userType',
    align: 'left',
    filterable: true,
    filterType: 'includes',
  },

]

const { data: users, refresh } = useLazyFetch('/api/user-definitions/user-definitions', {
  default: () => [],
  method: 'POST',
  body: {},
})
const userTypeOptions = [{ label: 'Operatör', value: 1 }, { label: 'Diğer', value: 2 }]

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

function handleSelection(user: User) {
  if (selected.value.userId === user.userId) {
    selected.value = {
      userId: -1,
      userName: '',
      userSurname: '',
      userPass: '',
      userInfo: '',
      userActive: 0,
      userType: -1,
      userMode: '',
      userMode2: '',
    }
  } else {
    selected.value = user
  }
}

async function handleUserAdd() {
  if (selected.value.userType)
    selected.value.userType = selected.value.userType === 'Operatör' ? 1 : 2
  await addUser(selected.value)
  await refresh()
}

async function handleUserEdit() {
  if (selected.value.userType)
    selected.value.userType = selected.value.userType === 'Operatör' ? 1 : 2
  await editUser(selected.value)
  await refresh()
}

async function handleUserDelete() {
  await deleteUser([selected.value.userId])
  await refresh()
}

async function handleFilterSlotsUpdate(updatedValue) {
  users.value = await $fetch('/api/user-definitions/user-definitions', {
    method: 'POST',
    body: {
      filters: updatedValue,
    },
  })
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row input-field justify-around">
        <q-input
          v-model="selected.userId"
          label="Kullanıcı No"
          filled
          clearable
        />
        <q-input
          v-model="selected.userName"
          label="İsim"
          filled
          clearable
        />
        <q-input
          v-model="selected.userSurname"
          label="Soy İsim"
          filled
          clearable
        />
        <q-input
          v-model="selected.userPass"
          label="Kullanıcı Şifresi"
          filled
          clearable
        />
        <q-select
          v-model="selected.userType"
          :options="userTypeOptions"
          option-label="label"
          option-value="value"
          label="Kullanıcı Tipi"
          filled
        />
      </div>

      <div class="flex flex-row justify-start">
        <q-input
          v-model="selected.userInfo"
          label="Bilgi Notu"
          type="textarea"
          class="w-3xl"
        />
        <q-checkbox v-model="selected.userActive" label="Aktif" />
      </div>

      <div class="button-field my-8">
        <q-btn
          label="Ekle"
          no-caps
          @click="handleUserAdd()"
        />
        <q-btn
          label="Düzenle"
          no-caps
          @click="handleUserEdit()"
        />
        <q-btn
          label="Sil"
          no-caps
          @click="handleUserDelete()"
        />
        <q-btn
          label="Yetkiler"
          no-caps
          @click="showPermissionsDialog = true"
        />
      </div>
    </q-card-section>
  </q-card>

  <div class="table-scroll">
    <FilterableTable
      v-model:selected="selected"
      :rows="users"
      :columns="columns"
      @update-filter-slots="evt => handleFilterSlotsUpdate(evt)"
    >
      <template #custombody="users">
        <q-tr
          :class="{ 'selected-row': selected.userId === users.row.userId }"
          @click="handleSelection(users.row)"
        >
          <q-td
            v-for="row in users.cols"
            :key="row"
          >
            <span v-if="row.field === 'userActive'">
              {{ row.value ? 'Evet' : 'Hayır' }}
            </span>
            <span v-else-if="row.field === 'userType'">
              {{ userTypeOptions.find(o => o.value === row.value).label }}
            </span>
            <span v-else>
              {{ row.value }}
            </span>
          </q-td>
        </q-tr>
      </template>
    </FilterableTable>
    <UserPermissionsDialog
      :show="showPermissionsDialog"
      :selected="selected"
      @close="showPermissionsDialog = false"
    />
  </div>
</template>

<style scoped>
.input-field > * {
  margin-right: 2em;
  width: 15em;
}

.button-field > * {
  margin-right: 2em;
}

:deep(.table-header > th) {
  font-weight: bold;
}
.table-scroll {
  max-height: 45em;
  overflow-y: auto;
}

.selected-row {
  background-color: #cce8ff;
}
</style>
