## Handling Long Operations

### Backend Usage
```ts
export default defineEventHandler(async (event) => {
  const t = await useTranslation(event)
  const { stream, logger, signal, isCancelled } = createLongOperationStream(event)
  const itemCount = 5
  // Run the operation in background
  ;(async () => {
    logger.info({ progress: 0 }, t('Starting long operation'))})
    logger.info({ progress: 10 }, t('Initialization complete'))
    try {
      for (let i = 1; i <= itemCount; i++) {
        if (isCancelled()) {
          logger.warn(t('Operation cancelled by client'))
          return
        }
        const itemProgress = 10 + Math.round((i - 1) / itemCount * 80)
        logger.info({ progress: itemProgress }, `Processing item ${i}/${itemCount}...`)
        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const completedProgress = 10 + Math.round(i / itemCount * 80)
        logger.info({ progress: completedProgress }, `Completed item ${i}/${itemCount}`)
      }
    }
    catch (error) {
      if (error.name === 'AbortError' || isCancelled()) {
        logger.warn(t('Operation aborted'))
        return
      }
      logger.error({ error }, t('Error during long operation'))
      logger.fail(error instanceof Error ? error.message : t('An unknown error occurred'))
    }
    logger.complete(t('Long operation completed successfully'))
  })()

  return stream
})
```

### Frontend Usage
```ts
await startLongOperation('/api/long-operation', {
  title: 'Long Operation',
  // Request options
})
```
