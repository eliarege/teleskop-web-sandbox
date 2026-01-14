# Unsaved Changes

## Use Case

Bu Nuxt tabanlı fonksiyon ve component seti, kullanıcıların form veya veri girişleri sırasında yaptıkları değişikliklerin kaydedilmemesi durumunda uyarılmasını sağlar. Kullanıcı sayfadan ayrılmaya çalıştığında veya tarayıcıyı kapatmaya çalıştığında, kaydedilmemiş değişiklikler varsa bir uyarı dialogu gösterilir.

Aşağıdaki composable fonksiyonlar mevcuttur:

- useUnsavedChangesGuard: Basit kullanım için bir composable fonksiyon sağlar.
- withUnsavedChangesDialogGuard: Quasar dialog bileşeni ile entegre çalışan bir composable fonksiyon sağlar.

## Usage

### useUnsavedChangesGuard

```ts
// <script setup>
const formData = ref({ /* ... */ })

const updateFormData = (newData) => {
  formData.value = newData
}

const { saving, markSaved } = useUnsavedChangesGuard({
  getState: () => formData.value,
  saveState: data => updateFormData(data),
  onSaveError: () => {
    // Handle save error
  },
  dialog: {
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. What would you like to do?',
  },
})
```

### withUnsavedChangesDialogGuard

```ts
// <script setup>

defineEmits(useDialogPluginComponent.emits)

const data = ref(props.data)
const { t } = useI18n()
const { dialogRef, onDialogOK, onDialogCancel, onDialogHide, saving, onDialogBeforeHide } = withUnsavedChangesDialogGuard(useDialogPluginComponent(), {
  getState: () => data.value,
  // Add `saveState` if you want function to handle saving
  saveState: async (state) => {
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    data.value = state
  },
  // Supports getter functions for computed translations
  dialog: () => ({
    dismissMessage: t('dismissChanges'),
    beforeRouteLeaveMessage: t('beforeRouteLeaveChanges'),
  }),
})
```

```html
<template>
  <!-- ref'in ve beforeHide, hide eventlerinin bağlantısı zorunlu -->
  <q-dialog
    ref="dialogRef"
    @before-hide="onDialogBeforeHide"
    @hide="onDialogHide"
  >
    <q-card>
      <!-- Dialog content -->
      <q-card-actions>
        <q-btn
          flat
          label="Cancel"
          :disabled="saving"
          @click="onDialogCancel"
        />
        <q-btn
          flat
          label="OK"
          :loading="saving"
          @click="onDialogOK"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
```

### Options

#### getState (Zorunlu)
- Type: `() => T`
- Description: Kaydedilmemiş değişikliklerin kontrol edileceği durumu döndüren fonksiyon.

#### saveState
- Type: `(state: T) => MaybePromise<void>`
- Default: `undefined`
- Description: Kaydetme işlemini gerçekleştiren fonksiyon. Eğer belirtilirse, kullanıcıya kaydetme seçeneği sunulur ve bu fonksiyon çağrılır.

#### onSaveError
- Type: `(error: any) => void`
- Default: `undefined`
- Description: Kaydetme işlemi sırasında bir hata oluşursa çağrılan fonksiyon.


#### dialog
- Type: `MaybeRefOrGetter<UnsavedChangesDialogOptions>`
- Default: `{}`
- Description: Uyarı dialogunun başlık, mesaj ve diğer özelliklerini belirler.

#### enabled
- Type: `MaybeRefOrGetter<boolean>`
- Default: `true`
- Description: Composable'ın etkinleştirilip etkinleştirilmeyeceğini belirler.

#### retryOnSaveFailure
- Type: `boolean`
- Default: `true`
- Description: Kaydetme işlemi başarısız olursa, kullanıcıya tekrar deneme seçeneği sunulup sunulmayacağını belirler.
