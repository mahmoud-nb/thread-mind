import { executeTool } from '~~/server/utils/ai/tool-executor'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    threadId: string
    toolCallId: string
    approved: boolean
  }>(event)

  if (!body.threadId || !body.toolCallId) {
    throw createError({ statusCode: 400, message: 'threadId and toolCallId are required' })
  }

  const prisma = usePrisma()

  // Find the pending tool call message
  const toolCallMsg = await prisma.message.findFirst({
    where: {
      threadId: body.threadId,
      role: 'tool_call',
      metadata: { contains: body.toolCallId },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!toolCallMsg) {
    throw createError({ statusCode: 404, message: 'Tool call not found' })
  }

  const toolData = JSON.parse(toolCallMsg.content) as { name: string; input: Record<string, unknown> }
  const metadata = JSON.parse(toolCallMsg.metadata || '{}')

  if (!body.approved) {
    // User rejected — save rejection as tool result
    const rejectionMsg = `❌ User rejected execution of ${toolData.name}`
    await prisma.message.create({
      data: {
        threadId: body.threadId,
        role: 'tool_result',
        content: rejectionMsg,
        metadata: JSON.stringify({ toolCallId: body.toolCallId, isError: false, rejected: true }),
      },
    })

    // Update the tool call to mark as rejected
    await prisma.message.update({
      where: { id: toolCallMsg.id },
      data: { metadata: JSON.stringify({ ...metadata, pending: false, rejected: true }) },
    })

    return { success: true, rejected: true, content: rejectionMsg }
  }

  // User approved — execute the tool
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: body.threadId },
    include: { project: true },
  })

  const result = await executeTool(toolData.name, toolData.input, thread.project.targetPath)

  // Save the result
  await prisma.message.create({
    data: {
      threadId: body.threadId,
      role: 'tool_result',
      content: result.content,
      metadata: JSON.stringify({ toolCallId: body.toolCallId, isError: result.isError }),
    },
  })

  // Update the tool call to mark as approved
  await prisma.message.update({
    where: { id: toolCallMsg.id },
    data: { metadata: JSON.stringify({ ...metadata, pending: false, approved: true }) },
  })

  return {
    success: true,
    rejected: false,
    content: result.content.slice(0, 2000),
    isError: result.isError,
  }
})
