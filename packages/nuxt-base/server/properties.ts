import process from 'node:process'

export default defineEventHandler(() => {
  const { APP_NAME, APP_VERSION } = process.env

  return {
    name: APP_NAME || 'unknown',
    version: APP_VERSION || 'unknown',
    // appIcon: '', /* '/favicon.ico */
  }
})
