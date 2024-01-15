import process from 'node:process'

// TODO: Application manifests
export default defineEventHandler(() => {
  return {
    name: import.meta.app.name,
    version: import.meta.app.version,
    buildDate: import.meta.app.buildDate,
    commitHash: import.meta.app.commitHash,
    nodeVersion: process.version,
  }
})
