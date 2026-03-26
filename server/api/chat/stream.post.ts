import { assembleContext, computeSummaryHash } from '~~/server/utils/context-engine'
import { createProvider } from '~~/server/utils/ai/provider'
import { executeTool } from '~~/server/utils/ai/tool-executor'
import { estimateCost } from '~~/server/utils/ai/token-counter'
import type { ChatMessage, ToolCall } from '~~/server/utils/ai/types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    threadId: string
    content: string
    provider?: string
    model?: string
    mode?: 'plan' | 'agent'
    approvedToolCalls?: string[] // IDs of previously approved tool calls
    continueAfterApproval?: boolean // Resume AI loop after tool approvals
  }>(event)

  if (!body.threadId || (!body.content && !body.continueAfterApproval)) {
    throw createError({ statusCode: 400, message: 'threadId and content are required' })
  }

  const prisma = usePrisma()

  // Get thread and project
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: body.threadId },
    include: { project: { include: { settings: true } } },
  })

  if (thread.isReadOnly) {
    throw createError({ statusCode: 403, message: 'Cannot send messages to read-only thread' })
  }

  // Save user message first (skip in continuation mode — no new user message)
  if (!body.continueAfterApproval) {
    await prisma.message.create({
      data: {
        threadId: body.threadId,
        role: 'user',
        content: body.content,
      },
    })
  }

  // Resolve provider and model
  let providerName = body.provider || thread.project.settings?.defaultProvider
  let modelId = body.model || thread.project.settings?.defaultModel

  // Fallback: find the first active configured provider
  if (!providerName || !modelId) {
    const activeProvider = await prisma.providerConfig.findFirst({
      where: { isActive: true },
    })
    if (activeProvider) {
      providerName = providerName || activeProvider.provider
      const models = JSON.parse(activeProvider.models) as string[]
      modelId = modelId || models[0] || null
    }
  }

  if (!providerName || !modelId) {
    throw createError({ statusCode: 400, message: 'No AI provider configured. Go to Settings to configure one.' })
  }

  const providerConfig = await prisma.providerConfig.findUnique({
    where: { provider: providerName },
  })

  if (!providerConfig || !providerConfig.isActive) {
    throw createError({ statusCode: 400, message: `Provider ${providerName} is not configured or inactive` })
  }

  const aiProvider = createProvider(providerName, providerConfig.apiKey)

  const chatMode = body.mode || 'plan'

  // Assemble context
  const context = await assembleContext(body.threadId, modelId, chatMode)

  // Set up SSE
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const send = (eventName: string, data: unknown) => {
    event.node.res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  // Tool use loop
  let messages: ChatMessage[] = [...context.messages]
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let fullAssistantContent = ''
  const allToolCalls: ToolCall[] = []
  let iterationCount = 0
  const maxIterations = 10

  try {
    while (iterationCount < maxIterations) {
      iterationCount++
      let iterationContent = ''
      let iterationToolCalls: ToolCall[] = []

      for await (const streamEvent of aiProvider.chatStream({
        model: modelId,
        systemPrompt: context.systemPrompt,
        messages,
        tools: context.tools.length > 0 ? context.tools : undefined,
        maxTokens: 4096,
      })) {
        switch (streamEvent.type) {
          case 'text_delta':
            iterationContent += streamEvent.content
            send('text_delta', { content: streamEvent.content })
            break

          case 'tool_call':
            iterationToolCalls.push({
              id: streamEvent.id,
              name: streamEvent.name,
              input: streamEvent.input,
            })
            send('tool_call', {
              id: streamEvent.id,
              name: streamEvent.name,
              input: streamEvent.input,
            })
            break

          case 'usage':
            totalInputTokens = streamEvent.inputTokens
            totalOutputTokens += streamEvent.outputTokens
            break

          case 'stop':
            // handled after loop
            break
        }
      }

      fullAssistantContent += iterationContent
      allToolCalls.push(...iterationToolCalls)

      // If no tool calls, we're done
      if (iterationToolCalls.length === 0) break

      // Add assistant message with tool calls to conversation
      messages.push({
        role: 'assistant',
        content: iterationContent,
        toolCalls: iterationToolCalls,
      })

      // Classify tools: read-only vs write (need permission)
      const WRITE_TOOLS = ['write_file', 'edit_file']
      const approvedIds = new Set(body.approvedToolCalls || [])

      // Execute each tool call and add results
      for (const tc of iterationToolCalls) {
        const needsApproval = WRITE_TOOLS.includes(tc.name) && !approvedIds.has(tc.id)

        if (needsApproval) {
          // Send approval request to client — pause execution for this tool
          send('tool_approval_request', {
            id: tc.id,
            name: tc.name,
            input: tc.input,
          })

          // Save the pending tool call
          await prisma.message.create({
            data: {
              threadId: body.threadId,
              role: 'tool_call',
              content: JSON.stringify({ name: tc.name, input: tc.input }),
              metadata: JSON.stringify({ toolCallId: tc.id, pending: true }),
            },
          })

          // Add a placeholder result so the AI knows it's pending
          const pendingMsg = `⏳ Waiting for user approval to execute ${tc.name} on "${tc.input.path}"`
          messages.push({
            role: 'tool_result',
            content: pendingMsg,
            toolCallId: tc.id,
          })

          send('tool_result', {
            id: tc.id,
            name: tc.name,
            content: pendingMsg,
            isError: false,
            pending: true,
          })
          continue
        }

        const result = await executeTool(tc.name, tc.input, thread.project.targetPath)
        send('tool_result', {
          id: tc.id,
          name: tc.name,
          content: result.content.slice(0, 2000),
          isError: result.isError,
        })

        messages.push({
          role: 'tool_result',
          content: result.content,
          toolCallId: tc.id,
        })

        // Save tool call and result as messages
        await prisma.message.create({
          data: {
            threadId: body.threadId,
            role: 'tool_call',
            content: JSON.stringify({ name: tc.name, input: tc.input }),
            metadata: JSON.stringify({ toolCallId: tc.id }),
          },
        })
        await prisma.message.create({
          data: {
            threadId: body.threadId,
            role: 'tool_result',
            content: result.content,
            metadata: JSON.stringify({ toolCallId: tc.id, isError: result.isError }),
          },
        })
      }

      // If there are pending approvals, stop the loop and wait
      const hasPending = iterationToolCalls.some(tc => WRITE_TOOLS.includes(tc.name) && !approvedIds.has(tc.id))
      if (hasPending) {
        send('awaiting_approval', { toolIds: iterationToolCalls.filter(tc => WRITE_TOOLS.includes(tc.name) && !approvedIds.has(tc.id)).map(tc => tc.id) })
        break
      }

      // Continue the loop for the AI to process tool results
      iterationToolCalls = []
    }

    // Save final assistant message (only if there's content or tool calls)
    let assistantMsgId: string | null = null
    if (fullAssistantContent || allToolCalls.length > 0) {
      const assistantMsg = await prisma.message.create({
        data: {
          threadId: body.threadId,
          role: 'assistant',
          content: fullAssistantContent,
          metadata: JSON.stringify({
            provider: providerName,
            model: modelId,
            toolCalls: allToolCalls,
          }),
        },
      })
      assistantMsgId = assistantMsg.id

      // Track token usage
      const cost = estimateCost(modelId, totalInputTokens, totalOutputTokens)
      await prisma.tokenUsage.create({
        data: {
          projectId: thread.projectId,
          threadId: body.threadId,
          messageId: assistantMsg.id,
          provider: providerName,
          model: modelId,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          estimatedCostUsd: cost,
          contextTokensSaved: context.tokensSavedVsFullHistory,
        },
      })

      send('message_complete', {
        messageId: assistantMsg.id,
        tokenUsage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cost,
          tokensSaved: context.tokensSavedVsFullHistory,
        },
      })
    }

    // Check summary staleness
    const allMessages = await prisma.message.findMany({
      where: { threadId: body.threadId },
      select: { id: true },
    })
    const currentHash = computeSummaryHash(allMessages.map(m => m.id))
    if (thread.summaryHash !== currentHash) {
      send('summary_stale', { threadId: body.threadId })
    }
  } catch (err: any) {
    send('error', { message: err.message || 'An error occurred' })
  }

  event.node.res.end()
})
