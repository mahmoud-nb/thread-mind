import { importFromThreadmind } from '~~/server/utils/markdown-sync'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ projectId: string }>(event)

  if (!body.projectId) {
    throw createError({ statusCode: 400, message: 'projectId is required' })
  }

  const result = await importFromThreadmind(body.projectId)
  return result
})
