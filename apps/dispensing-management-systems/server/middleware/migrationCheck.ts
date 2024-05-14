let migrationsComplete = false
export function setMigrationsComplete(status: boolean) {
  migrationsComplete = status
}
// Middleware to block requests until migrations are complete
export default defineEventHandler(async () => {
  if (!migrationsComplete) {
    const response = {
      status: 503,
      statusText: 'Service Unavailable',
      message: 'Server is starting up, please try again later.',
    }
    return new Response(JSON.stringify(response), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
})
