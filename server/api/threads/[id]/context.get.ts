import { assembleContext } from '~~/server/utils/context-engine'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const modelId = (query.model as string) || 'claude-sonnet-4-20250514'

  const context = await assembleContext(id, modelId)

  return {
    systemPrompt: context.systemPrompt,
    messageCount: context.messages.length,
    toolCount: context.tools.length,
    tokenEstimate: context.tokenEstimate,
    tokensSaved: context.tokensSavedVsFullHistory,
    breakdown: context.breakdown,
  }
})
