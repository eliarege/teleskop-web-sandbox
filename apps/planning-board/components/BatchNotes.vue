<script setup lang="ts">
import { Toast } from '@bryntum/schedulerpro-trial'

const props = defineProps<{ jobOrder: string }>()
const emit = defineEmits(['updateScheduler'])
const { t, d } = useI18n()
const { data: batchNotes, refresh } = await useFetch('/api/note/getNote', {
  query: { jobOrder: props.jobOrder },
})
const refactoredBatchNotes = computed(() => batchNotes.value?.map((a) => {
  return {
    ...a,
    noteDate: d(a.noteDate, 'datetime'),
  }
}))
// TODO: format batchNotes date with useI18N.d
const columns = computed(() => {
  return [
    { name: 'userName', label: t('columns.user-name'), align: 'center', field: 'userName' },
    { name: 'jobOrder', label: t('columns.job-order'), align: 'center', field: 'jobOrder' },
    { name: 'note', label: t('columns.note'), align: 'center', field: 'note' },
    { name: 'noteDate', label: t('columns.date'), align: 'center', field: 'noteDate' },
  ]
})
const newNote = reactive({
  jobOrder: props.jobOrder,
  note: '',
  showOnScreen: false,
  userId: 1, // TODO: ADD USER ID
})
function addNote() {
  $fetch('/api/note/addNote', {
    method: 'POST',
    body: newNote,
  }).then(() => {
    emit('updateScheduler')
    Toast.show(t('toast.succesful'))
    refresh()
  }).catch((err) => {
    Toast.show(t('toast.error', err))
  })
}
const q = useQuasar()
function deleteNote(id: number) {
  q.dialog({
    title: 'Are you sure to delete this note?',
    class: 'e-border',
    ok: {
      push: true,
      label: t('template.ok'),
      color: 'primary',
    },
    cancel: {
      push: true,
      label: t('template.cancel'),
      color: 'red',
    },
  }).onOk(async () => {
    $fetch('/api/note/deleteNote', {
      method: 'delete',
      query: { id },
    }).then(() => {
      emit('updateScheduler')
      Toast.show(t('toast.succesful'))
      refresh()
    }).catch((err) => {
      Toast.show(t('toast.error', err))
    })
  })
}
</script>

<template>
  <div class="note-wrapper">
    <QTable
      :rows="refactoredBatchNotes"
      :columns="columns"
      :rows-per-page-options="[]"
      no-data-label="No Note"
    >
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
            {{ t('template.delete') }}
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
            {{ Array.isArray(col.value) ? Object.create(col.value) : col.value }}
          </q-td>
          <q-td class="flex justify-center items-center">
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
          <QCheckbox
            v-model="newNote.showOnScreen"
            class="text-sm"
            label="Show on Screen"
            checked-icon="task_alt"
            unchecked-icon="highlight_off"
          />
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

<i18n>
 {
  "en": {
    "columns": {
      "user-name": "User Name",
      "job-order": "Job Order",
      "note": "Note",
      "date": "Date"
    },
    "toast": {
      "succesful": "Note Added succesfuly!",
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
      "date": "Tarih"
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
