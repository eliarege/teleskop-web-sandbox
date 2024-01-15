import { knex } from '~/server/connectionPool'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const url = `${config.planningEngineUrl}/planning_board/machines`
  return await $fetch(url)
})
