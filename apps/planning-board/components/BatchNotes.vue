<script setup lang="ts">
import { Toast } from '@bryntum/schedulerpro'

const props = defineProps<{ jobOrder: string }>()
const emit = defineEmits(['updateScheduler'])
const { t, d } = useI18n()
const { data: batchNotes, refresh } = await useFetch('/api/note/getNote', {
  query: { jobOrder: props.jobOrder },
  default: () => [],
})
const refactoredBatchNotes = computed(() => batchNotes.value.map((a) => {
  return {
    ...a,
    noteDate: d(a.noteDate, 'datetime'),
  }
}))
const search = ref('')
const searchBatchNotes = ref([])
watch(refactoredBatchNotes, (notes) => {
  searchBatchNotes.value = notes.filter(item => item.jobOrder.includes(search.value))
}, { immediate: true })

// TODO: format batchNotes date with useI18N.d
const columns = computed(() => {
  return [
    { name: 'userName', label: t('batch-notes.columns.user-name'), align: 'center', field: 'userName' },
    { name: 'jobOrder', label: t('batch-notes.columns.job-order'), align: 'center', field: 'jobOrder' },
    { name: 'note', label: t('batch-notes.columns.note'), align: 'center', field: 'note' },
    { name: 'noteDate', label: t('batch-notes.columns.date'), align: 'center', field: 'noteDate' },
    { name: 'showOnScreen', label: t('batch-notes.columns.show-on-screen'), align: 'center', field: 'showOnScreen' },
  ]
})
const newNote = reactive({
  jobOrder: props.jobOrder,
  note: '',
  showOnScreen: true,
  userId: 1, // TODO: ADD USER ID
})
function addNote() {
  $fetch('/api/note/addNote', {
    method: 'POST',
    body: newNote,
  }).then(() => {
    emit('updateScheduler')
    Toast.show(t('batch-notes.toast.succesful'))
    refresh()
  }).catch((err) => {
    Toast.show(t('batch-notes.toast.error', err))
  })
}
function updateNote(id: number, showOnScreen: boolean) {
  $fetch('/api/note/updateNote', {
    method: 'PUT',
    body: { noteKey: id, showOnScreen },
  }).then(() => {
    Toast.show(t('batch-notes.toast.succesful'))
    emit('updateScheduler')
  }).catch((err) => {
    Toast.show(t('batch-notes.toast.error', err))
  })
}
const q = useQuasar()
function deleteNote(id: number) {
  q.dialog({
    title: 'Are you sure to delete this note?',
    class: 'e-border',
    ok: {
      push: true,
      label: t('batch-notes.template.ok'),
      color: 'primary',
    },
    cancel: {
      push: true,
      label: t('batch-notes.template.cancel'),
      color: 'red',
    },
  }).onOk(async () => {
    $fetch('/api/note/deleteNote', {
      method: 'delete',
      query: { id },
    }).then(() => {
      emit('updateScheduler')
      Toast.show(t('batch-notes.toast.succesful'))
      refresh()
    }).catch((err) => {
      Toast.show(t('batch-notes.toast.error', err))
    })
  })
}
</script>

<template>
  <div class="note-wrapper">
    <QTable
      :rows="searchBatchNotes"
      :columns="columns"
      :rows-per-page-options="[]"
      no-data-label="No Note"
    >
      <template #top>
        <q-space />
        <q-input v-model="search" dense>
          <template #append>
            <TwIcon name="i-material-symbols:search" />
          </template>
        </q-input>
      </template>
      <template #header="prop">
        <q-tr :props="prop">
          <q-th
            v-for="col in prop.cols"
            :key="col.name"
            :props="prop"
          >
            {{ col.label }}
          </q-th>
          <q-th auto-width>
            {{ t('batch-notes.template.delete') }}
          </q-th>
        </q-tr>
      </template>
      <template #body="prop">
        <q-tr :props="prop">
          <q-td
            v-for="col in prop.cols"
            :key="col.name"
            :props="prop"
          >
            <span v-if="col.name !== 'showOnScreen'">
              {{ col.value }}
            </span>
            <span v-else>
              <q-checkbox v-model="prop.row.showOnScreen" @update:model-value="updateNote(prop.row.id, prop.row.showOnScreen)" />
            </span>
          </q-td>
          <q-td auto-width>
            <q-icon
              name="delete"
              size="30px"
              class="cursor-pointer"
              @click="deleteNote(prop.row.id)"
            />
          </q-td>
        </q-tr>
      </template>
    </QTable>
    <br>
    <QInput
      v-model="newNote.note"
      placeholder="Add new Note"
      outlined
      clearable
      color="primary"
    >
      <template #after>
        <div class="flex-center flex-col px-2">
          <QBtn
            color="primary"
            label="Add Note"
            :disabled="newNote.note === '' || newNote.note === null"
            @click="addNote()"
          />
        </div>
      </template>
    </QInput>
  </div>
</template>

<style scoped lang="postcss">
.note-wrapper {
  @apply w-full max-h-200 p-3 overflow-auto border border-3 border-gray-600 rounded z-100 bg-white items-center;
}
</style>

<i18n lang="json">
 {
  "en": {
    "columns": {
      "user-name": "User Name",
      "job-order": "Job Order",
      "note": "Note",
      "date": "Date",
      "show-on-screen": "Show On Screen"
    },
    "toast": {
      "succesful": "Note Added successfully!",
      "error": "An error occured: {err}"
    },
    "dialog": {
      "title": "Are you sure to delete this note?"
    },
    "template": {
      "no-data": "No Note to show.",
      "delete": "Delete",
      "ok": "Delete",
      "cancel": "Cancel",
      "new-note": "Add new Note",
      "show-on-screen": "Show on Screen",
      "submit": "Add Note"
    }
  },
  "tr": {
    "columns": {
      "user-name": "Kullanıcı Adı",
      "job-order": "İş Emri",
      "note": "Not",
      "date": "Tarih",
      "show-on-screen": "Ekranda Göster"
    },
    "toast": {
      "succesful": "Not başarıyla eklendi!",
      "error": "Bir hata oluştu: {err}"
    },
    "dialog": {
      "title": "Bu notu silmek istediğinizden emin misiniz?"
    },
    "template": {
      "no-data": "Gösterilecek not yok.",
      "delete": "Sil",
      "ok": "Sil",
      "cancel": "İptal",
      "new-note": "Yeni not ekle",
      "show-on-screen": "Ekranda göster",
      "submit": "Not Ekle"
    }
  }
}
</i18n>
