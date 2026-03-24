import { createHash } from 'crypto'
import type { ChatMessage } from './ai/types'
import { estimateTokens, getMaxContextTokens } from './ai/token-counter'
import { FILE_TOOLS } from './ai/tools'

interface ThreadWithRelations {
  id: string
  title: string
  systemPrompt: string | null
  summary: string | null
  status: string
  parentId: string | null
  messages: Array<{
    id: string
    role: string
    content: string
    isPinned: boolean
    createdAt: Date
  }>
}

interface ContextBreakdownSection {
  label: string
  text: string
  tokens: number
}

export interface AssembledContext {
  systemPrompt: string
  messages: ChatMessage[]
  tools: typeof FILE_TOOLS
  tokenEstimate: number
  tokensSavedVsFullHistory: number
  breakdown: ContextBreakdownSection[]
}

export async function assembleContext(
  threadId: string,
  modelId: string
): Promise<AssembledContext> {
  const prisma = usePrisma()

  // 1. Get current thread with messages
  const thread = await prisma.thread.findUniqueOrThrow({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      project: { include: { settings: true } },
    },
  })

  // 2. Get ancestor chain (root -> ... -> parent)
  const ancestors = await getAncestorChain(threadId)

  // 3. Build system prompt from parts
  const systemParts: string[] = []
  const breakdown: ContextBreakdownSection[] = []

  // Project-level custom prompt
  if (thread.project.settings?.customPrompt) {
    systemParts.push(thread.project.settings.customPrompt)
    breakdown.push({
      label: 'Project prompt',
      text: thread.project.settings.customPrompt,
      tokens: estimateTokens(thread.project.settings.customPrompt),
    })
  }

  // Ancestor summaries (root first)
  for (const ancestor of ancestors) {
    if (ancestor.summary) {
      const section = formatAncestorSummary(ancestor)
      systemParts.push(section)
      breakdown.push({
        label: `Summary: ${ancestor.title}`,
        text: section,
        tokens: estimateTokens(section),
      })
    }

    // Pinned messages from ancestors
    const pinnedMessages = ancestor.messages.filter(m => m.isPinned)
    for (const msg of pinnedMessages) {
      const section = `## Pinned from "${ancestor.title}":\n${msg.content}`
      systemParts.push(section)
      breakdown.push({
        label: `Pinned: ${ancestor.title}`,
        text: section,
        tokens: estimateTokens(section),
      })
    }
  }

  // Thread-specific system prompt
  if (thread.systemPrompt) {
    systemParts.push(`## Current Thread Instructions:\n${thread.systemPrompt}`)
    breakdown.push({
      label: 'Thread prompt',
      text: thread.systemPrompt,
      tokens: estimateTokens(thread.systemPrompt),
    })
  }

  const systemPrompt = systemParts.join('\n\n---\n\n')
  const systemTokens = estimateTokens(systemPrompt)

  // 4. Build message history within token budget
  const maxContext = getMaxContextTokens(modelId)
  const responseReserve = 4096
  const toolsTokens = estimateTokens(JSON.stringify(FILE_TOOLS))
  const messageBudget = maxContext - systemTokens - responseReserve - toolsTokens

  const allMessages = thread.messages.filter(m => m.role !== 'system')
  const selectedMessages = selectMessagesWithinBudget(allMessages, messageBudget)

  const chatMessages: ChatMessage[] = selectedMessages.map(m => {
    if (m.role === 'tool_call' || m.role === 'tool_result') {
      const metadata = m.metadata ? JSON.parse(m.metadata) : {}
      return {
        role: m.role as ChatMessage['role'],
        content: m.content,
        toolCallId: metadata.toolCallId,
        toolCalls: metadata.toolCalls,
      }
    }
    return {
      role: m.role as ChatMessage['role'],
      content: m.content,
    }
  })

  const messageTokens = selectedMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
  breakdown.push({
    label: `Messages (${selectedMessages.length}/${allMessages.length})`,
    text: `${selectedMessages.length} recent messages selected`,
    tokens: messageTokens,
  })

  // 5. Calculate savings
  const fullHistoryTokens = calculateFullHistoryTokens(thread.messages, ancestors)
  const actualTokens = systemTokens + messageTokens + toolsTokens
  const tokensSaved = Math.max(0, fullHistoryTokens - actualTokens)

  return {
    systemPrompt,
    messages: chatMessages,
    tools: FILE_TOOLS,
    tokenEstimate: actualTokens,
    tokensSavedVsFullHistory: tokensSaved,
    breakdown,
  }
}

async function getAncestorChain(threadId: string): Promise<ThreadWithRelations[]> {
  const prisma = usePrisma()
  const chain: ThreadWithRelations[] = []

  let currentThread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { parentId: true },
  })

  while (currentThread?.parentId) {
    const parent = await prisma.thread.findUnique({
      where: { id: currentThread.parentId },
      include: {
        messages: {
          where: { isPinned: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!parent) break
    chain.unshift(parent as ThreadWithRelations)
    currentThread = parent
  }

  return chain
}

function formatAncestorSummary(thread: ThreadWithRelations): string {
  return `## Context from: "${thread.title}" [${thread.status}]\n${thread.summary}`
}

function selectMessagesWithinBudget(
  messages: Array<{ id: string; role: string; content: string; createdAt: Date }>,
  tokenBudget: number
): typeof messages {
  if (messages.length === 0) return []

  const selected: typeof messages = []
  let remaining = tokenBudget

  // Always try to include the first message for context
  if (messages.length > 0) {
    const firstCost = estimateTokens(messages[0].content)
    if (firstCost <= remaining) {
      selected.push(messages[0])
      remaining -= firstCost
    }
  }

  // Then fill from the most recent messages backwards
  const reversed = messages.slice(1).reverse()
  const recentSelected: typeof messages = []

  for (const msg of reversed) {
    const cost = estimateTokens(msg.content)
    if (remaining - cost < 0) break
    recentSelected.unshift(msg)
    remaining -= cost
  }

  // Combine: first message + recent messages (avoiding duplicates)
  if (selected.length > 0 && recentSelected.length > 0 && selected[0].id === recentSelected[0].id) {
    return recentSelected
  }

  return [...selected, ...recentSelected]
}

function calculateFullHistoryTokens(
  currentMessages: Array<{ content: string }>,
  ancestors: ThreadWithRelations[]
): number {
  let total = 0

  // All ancestor messages (if we had sent them instead of summaries)
  for (const ancestor of ancestors) {
    total += ancestor.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
    // Assume each ancestor had ~20 messages on average as rough estimate
    total += 20 * 500 // 500 tokens per average message
  }

  // Current thread messages
  total += currentMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0)

  return total
}

/**
 * Generate a hash of message IDs for staleness detection
 */
export function computeSummaryHash(messageIds: string[]): string {
  return createHash('md5').update(messageIds.join(',')).digest('hex')
}

/**
 * Generate a summary prompt for a thread
 */
export function buildSummaryPrompt(threadTitle: string, systemPrompt: string | null, messages: Array<{ role: string; content: string }>): string {
  const conversation = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `**${m.role}**: ${m.content}`)
    .join('\n\n')

  return `You are summarizing a development conversation thread.

Thread title: "${threadTitle}"
${systemPrompt ? `Thread context: ${systemPrompt}` : ''}

## Conversation:
${conversation}

---
Summarize the key decisions, outcomes, code changes, and unresolved questions.
Keep it under 500 words. Use bullet points. Focus on facts useful for continuing related work.
Write the summary in the same language as the conversation.`
}
