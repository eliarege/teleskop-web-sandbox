<script setup lang="ts">
import { Toast } from '@bryntum/schedulerpro-trial'

const props = defineProps<{ jobOrder: string }>()
const { data: batchNotes, refresh } = await useFetch('/api/note/getNote', {
  query: { jobOrder: props.jobOrder },
})
// TODO: format batchNotes date with useI18N.d
const columns = computed(() => {
  return [
    { name: 'userName', label: 'User Name', align: 'center', field: 'userName' },
    { name: 'jobOrder', label: 'Job Order', align: 'center', field: 'jobOrder' },
    { name: 'note', label: 'Note', align: 'center', field: 'note' },
    { name: 'noteDate', label: 'Date', align: 'center', field: 'noteDate' },
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
    Toast.show('Note added succefuly')
    refresh()
  }).catch((err) => {
    Toast.show(`An error occured: ${err}`)
  })
}
const q = useQuasar()
function deleteNote(id: number) {
  q.dialog({
    title: `Delete Rule ${id}`,
    message: `Are you sure to delete rule ${id}`,
    class: 'text-center',
    ok: {
      push: true,
      color: 'primary',
    },
    cancel: {
      push: true,
      color: 'red',
    },
  }).onOk(async () => {
    $fetch('/api/note/deleteNote', {
      method: 'delete',
      query: { id },
    }).then(() => {
      Toast.show('Note deleted succefuly')
      refresh()
    }).catch((err) => {
      Toast.show(`An error occured: ${err}`)
    })
  })
}
</script>

<template>
  <div class="note-wrapper">
    <QTable
      :rows="batchNotes"
      :columns="columns"
      :rows-per-page-options="[]"
      no-data-label="No Rule"
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
            Delete
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
