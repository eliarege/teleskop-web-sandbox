import process from 'node:process'

// TODO: Application manifests
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    name: config.twName,
    version: config.twVersion,
    buildDate: config.twBuildDate,
    commitHash: config.twCommitHash,
    nodeVersion: process.version,
  }
})

// NUXT_APP_NAME
// NUXT_APP_COMMIT_HASH
