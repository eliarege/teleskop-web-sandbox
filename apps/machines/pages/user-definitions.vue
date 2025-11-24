<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UserEditDialog from '~/components/UserEditDialog.vue'
import UserPermissionsDialog from '~/components/UserPermissionsDialog.vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'

interface User {
  userId: number
  userName: string
  userSurname: string
  userPass: string
  userMode: string
  userInfo: string
  userActive: boolean
  userDeleted: boolean
  userMode2: string
  userType: number
}

const { t } = useI18n()
const { fetch } = useKeycloak()
const { notifyError, notifySuccess } = useNotify()

const editUser = ref<User | undefined>(undefined)
const editDialog = ref(false)
const permissionsDialog = ref(false)
const confirmDialog = ref(false)

const rows = ref<User[]>([])
const loading = ref(false)
const selected = ref<User[]>([])

const userTypeOptions = [
  { label: t('operator'), value: 1 },
  { label: t('other'), value: 2 },
]

const columns = [
  { name: 'userId', label: 'ID', field: 'userId', align: 'left' as const, sortable: true },
  { name: 'userName', label: 'Ad', field: 'userName', align: 'left' as const, sortable: true },
  { name: 'userSurname', label: 'Soyad', field: 'userSurname', align: 'left' as const, sortable: true },
  { name: 'userPass', label: 'Pass', field: 'userPass', align: 'left' as const },
  {
    name: 'userType',
    label: 'Tip',
    field: (row: User) => {
      const option = userTypeOptions.find(opt => opt.value === row.userType)
      return option ? option.label : row.userType
    },
    align: 'left' as const,
  },
  { name: 'userActive', label: 'Aktif', field: 'userActive', align: 'left' as const },
]

async function loadUsers() {
  loading.value = true
  try {
    const res = await fetch<User[]>('/api/user-definitions/route')
    rows.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.error(err)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  editUser.value = undefined
  editDialog.value = true
}

function openEditDialog() {
  if (selected.value.length !== 1)
    return
  editUser.value = selected.value[0]
  editDialog.value = true
}

function onUserSaved() {
  loadUsers()
  selected.value = []
}

async function onDeleteUser() {
  if (selected.value.length === 0)
    return

  confirmDialog.value = true
}

async function handleDeleteConfirmed() {
  const userIds = selected.value.map(u => u.userId)

  try {
    for (const id of userIds) {
      await fetch(`/api/user-definitions/${id}`, {
        method: 'DELETE',
      })
    }

    // Tabloyu tekrar yükle
    await loadUsers()
    selected.value = []

    notifySuccess('Kullanıcılar başarıyla silindi.')
  } catch (err) {
    console.error('Kullanıcı silme işlemi başarısız oldu', err)
    notifyError('Kullanıcı silme işlemi başarısız oldu.')
  }
}

function openPermissions() {
  if (selected.value.length !== 1)
    return

  editUser.value = selected.value[0]
  permissionsDialog.value = true
}

function handleRowClick(_e: any, row: User) {
  selected.value = [row]
}

onMounted(loadUsers)
</script>

<template>
  <q-page padding>
    <q-card class="q-pa-md">
      <div class="q-mb-md flex justify-between items-center">
        <div class="text-h6">
          Kullanıcı Tanımları
        </div>

        <div class="q-gutter-sm">
          <q-btn
            color="primary"
            label="Add"
            icon="add"
            @click="openAddDialog"
          />
          <q-btn
            color="primary"
            label="Edit"
            icon="edit"
            :disable="selected.length !== 1"
            @click="openEditDialog"
          />
          <q-btn
            color="primary"
            label="Delete"
            icon="delete"
            :disable="selected.length === 0"
            @click="onDeleteUser"
          />
          <q-btn
            color="primary"
            label="Permissions"
            icon="security"
            :disable="selected.length !== 1"
            @click="openPermissions"
          />
        </div>
      </div>

      <!-- QTable -->
      <q-table
        v-model:selected="selected"
        :rows="rows"
        :columns="columns"
        row-key="userId"
        selection="multiple"
        :loading="loading"
        class="max-h-150 select-none"
        :rows-per-page-options="[0]"
        table-header-style="position: sticky; top: 0; z-index: 1; height: 50px;"
        table-header-class="bg-gray-1 dark:bg-dark-4"
        flat
        bordered
        @row-click="handleRowClick"
        @row-dblclick="openEditDialog"
      >
        <template #loading>
          <q-inner-loading showing>
            <q-spinner color="primary" />
          </q-inner-loading>
        </template>

        <!-- Aktif / Pasif Badge -->
        <template #body-cell-userActive="props">
          <q-td :props="props">
            <q-badge :color="props.row.userActive ? 'green' : 'red'" class="text-white">
              {{ props.row.userActive ? 'Aktif' : 'Pasif' }}
            </q-badge>
          </q-td>
        </template>

        <!-- Silinmiş Badge -->
        <template #body-cell-userDeleted="props">
          <q-td :props="props">
            <q-badge :color="props.row.userDeleted ? 'red' : 'grey'" class="text-white">
              {{ props.row.userDeleted ? 'Silinmiş' : 'Normal' }}
            </q-badge>
          </q-td>
        </template>
      </q-table>

      <!-- User Edit / Add Dialog -->
      <UserEditDialog
        v-model="editDialog"
        :user="editUser"
        :existing-user-ids="rows.map(r => r.userId)"
        :user-type-options="userTypeOptions"
        @saved="onUserSaved"
        @edit-permissions="openPermissions"
      />

      <!-- User Permissions Dialog -->
      <UserPermissionsDialog
        v-model="permissionsDialog"
        :user="editUser"
      />

      <ConfirmDialog
        v-model="confirmDialog"
        :title="t('confirmDelete')"
        :message="selected.length === 1
          ? t('confirmDeleteUser', { name: `${selected[0].userName} ${selected[0].userSurname}` })
          : t('confirmDeleteUsers', { count: selected.length })"
        :confirm-label="t('delete')"
        :cancel-label="t('cancel')"
        confirm-color="negative"
        @confirm="handleDeleteConfirmed"
      />
    </q-card>
  </q-page>
</template>
