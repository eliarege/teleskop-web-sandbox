import process from 'node:process'

// TODO: Application manifests
export default defineEventHandler(() => {
  return {
    name: process.env.APP_NAME || 'unknown',
    version: process.env.APP_VERSION || 'unknown',
  }
})
