## Handling Long Operations

### Use Case

Bu Nuxt tabanlı fonksiyon ve component seti, uzun süren backend işlemlerinin frontend tarafında gerçek zamanlı olarak izlenmesini sağlamak amacıyla tasarlanmıştır.
Sistem, Server-Sent Events (SSE) kullanarak backend’den istemciye sürekli durum güncellemeleri gönderir ve kullanıcının işlem sürecinden haberdar olmasını sağlar.

Bu yapı özellikle:

- Kullanıcının işlem süresince ekran başında kalmasının beklendiği,
- İşlem ilerlemesinin veya durum değişikliklerinin anlık olarak gösterilmesi gereken,
- Kullanıcının tarayıcıyı kapatması veya sayfadan ayrılması halinde, devam eden işlemin iptal edilmesi gereken

senaryolar için uygundur.

### Backend Usage
```ts
export default defineEventHandler(async (event) => {
  const t = await useTranslation(event)
  const itemCount = 5
  const res = runLongOperation(event, ({ logger, cancellation }) => {
    logger.info(t('Starting long operation'))
    logger.info(t('Initialization complete'))
    logger.progress(10)

    for (let i = 1; i <= itemCount; i++) {
      cancellation.throwIfCancelled()
      const itemProgress = 10 + Math.round((i - 1) / itemCount * 80)
      logger.info(`Processing item ${i}/${itemCount}...`)
      logger.progress(itemProgress)
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const completedProgress = 10 + Math.round(i / itemCount * 80)
      logger.info(`Completed item ${i}/${itemCount}`)
      logger.progress(completedProgress)
    }

    logger.complete(t('Long operation completed successfully'))
  })

  if (res.kind === 'stream') {
    return res.stream
  } else {
    throw createError({
      status: 400,
      message: res.kind === 'aborted'
        ? t('Operation was aborted')
        : t('Operation already completed'),
    })
  }
})
```

### Frontend Usage
```ts
await startLongOperation('/api/long-operation', {
  title: 'Long Operation',
  statusTitles: {
    // Different titles based on state of operation
  },
  fetchOptions: {
    // Request/Fetch options
  }
})
```

### Related Files

> TODO: Move these files to a separate layer maybe
```
├── components
│   └── LongOperationDialog.vue
├── composables
│   └── useLongOperation.ts
├── docs
│   └── longOperation.md
├── locales
│   ├── en.json
│   ├── pt.json
│   └── tr.json
├── server
│   └── utils
│       ├── keyValueRepository.ts
│       └── longOperationStream.ts
├── shared
│   └── longOperation.types.ts
└── utils
    └── longOperation.ts
```
