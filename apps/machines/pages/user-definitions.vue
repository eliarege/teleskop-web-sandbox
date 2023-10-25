<script setup lang="ts">
import type { QTableColumn } from 'quasar'
import type { User } from '~/types'

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

const users = ref(await $fetch('/api/machine/user-definitions'))
const userTypeOptions = ['Operatör', 'Diğer']
const selectedUsers = ref<Array<User>>([users.value[0]])
</script>

<template>
  <q-card>
    <q-card-section>
      <div class="flex flex-row input-field justify-between">
        <q-input
          v-model="selectedUsers[0].userId"
          label="Kullanıcı No"
          filled
          clearable
        />
        <q-input
          v-model="selectedUsers[0].userName"
          label="İsim"
          filled
          clearable
        />
        <q-input
          v-model="selectedUsers[0].userSurname"
          label="Soy İsim"
          filled
          clearable
        />
        <q-input
          v-model="selectedUsers[0].userPass"
          label="Kullanıcı Şifresi"
          filled
          clearable
        />
        <q-select
          v-model="selectedUsers[0].userType"
          :options="userTypeOptions"
          label="Kullanıcı Tipi"
          filled
        />
      </div>

      <div class="flex flex-row justify-start">
        <q-input
          label="Bilgi Notu"
          type="textarea"
          class="w-3xl"
        />
        <q-checkbox v-model="selectedUsers[0].userActive" label="Aktif" />
      </div>

      <div class="input-field my-8">
        <q-btn label="Ekle" no-caps />
        <q-btn label="Düzenle" no-caps />
        <q-btn
          label="Kaydet"
          no-caps
          disabled
        />
        <q-btn
          label="Sil"
          no-caps
          disabled
        />
        <q-btn
          label="İptal"
          no-caps
          disabled
        />
        <q-btn label="Yetkiler" no-caps />
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
  </div>
</template>

<style scoped>
.input-field > * {
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
