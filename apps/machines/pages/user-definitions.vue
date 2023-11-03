<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { User } from '~/types'
import { addUser, deleteUser, editUser, getUsers } from '~/utils'

const columns: QTableColumn<User>[] = [
  {
    name: 'userId',
    label: 'Kullanıcı No',
    field: row => row.userId,
    align: 'left',
  },
  {
    name: 'userName',
    label: 'İsim',
    field: row => row.userName,
    align: 'left',
  },
  {
    name: 'userSurname',
    label: 'Soyisim',
    field: row => row.userSurname,
    align: 'left',
  },

  {
    name: 'userPass',
    label: 'Kullanıcı Şifresi',
    field: row => row.userPass,
    align: 'left',
  },

  {
    name: 'userActive',
    label: 'Aktif',
    field: row => row.userActive,
    align: 'left',
  },

  {
    name: 'userType',
    label: 'Kullanıcı Tipi',
    field: row => row.userType,
    align: 'left',
  },

]

const users = ref(await getUsers())
const userTypeOptions = [{ label: 'Operatör', value: 1 }, { label: 'Diğer', value: 2 }]
const selectedUsers = ref<User[]>()
const user = ref<User>({
  userId: '',
  userName: '',
  userSurname: '',
  userPass: '',
  userInfo: '',
  userActive: false,
  userType: '',
})

const showPermissionsDialog = ref(false)

function handleSelection(e) {
  if (e.added) {
    user.value = e.rows[0]
    user.value.userType = user.value.userType = 1 ? 'Operatör' : 'Diğer'
  } else
    user.value = {
      userId: '',
      userName: '',
      userSurname: '',
      userPass: '',
      userInfo: '',
      userActive: false,
      userType: '',
    }
}

async function handleUserAdd() {
  if (user.value.userType)
    user.value.userType = user.value.userType === 'Operatör' ? 1 : 2
  await addUser(user.value)
  users.value.push(user.value)
}

async function handleUserEdit() {
  if (user.value.userType)
    user.value.userType = user.value.userType === 'Operatör' ? 1 : 2
  await editUser(user.value)
  users.value.push(user.value)
}

async function handleUserDelete() {
  await deleteUser([user.value.userId])
  users.value = users.value.filter((u: User) => u.userId !== user.value.userId)
}
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row input-field justify-around">
        <q-input
          v-model="user.userId"
          label="Kullanıcı No"
          filled
          clearable
        />
        <q-input
          v-model="user.userName"
          label="İsim"
          filled
          clearable
        />
        <q-input
          v-model="user.userSurname"
          label="Soy İsim"
          filled
          clearable
        />
        <q-input
          v-model="user.userPass"
          label="Kullanıcı Şifresi"
          filled
          clearable
        />
        <q-select
          v-model="user.userType"
          :options="userTypeOptions"
          option-label="label"
          option-value="value"
          label="Kullanıcı Tipi"
          filled
        />
      </div>

      <div class="flex flex-row justify-start">
        <q-input
          v-model="user.userInfo"
          label="Bilgi Notu"
          type="textarea"
          class="w-3xl"
        />
        <q-checkbox v-model="user.userActive" label="Aktif" />
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
    <q-table
      v-model:selected="selectedUsers"
      selection="single"
      :rows="users"
      :columns="columns"
      row-key="userId"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      bordered
      separator="cell"
      table-header-class="table-header"
      @selection="(e) => handleSelection(e)"
    >
      <template #body-cell-userActive="props">
        <q-td :props="props">
          <span v-if="props.row.userActive">
            Evet
          </span>
          <span v-else>Hayır</span>
        </q-td>
      </template>
      <template #body-cell-userType="props">
        <q-td :props="props">
          <span v-if="props.row.userType === 1">
            Operatör
          </span>
          <span v-else-if="props.row.userType === 2">Diğer</span>
        </q-td>
      </template>
    </q-table>

    <UserPermissionsDialog
      :show="showPermissionsDialog"
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
</style>
