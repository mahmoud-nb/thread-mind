interface ChatMessageDisplay {
  id?: string
  role: string
  content: string
  isPinned?: boolean
  metadata?: any
  createdAt?: string
  isStreaming?: boolean
}

interface ToolCallDisplay {
  id: string
  name: string
  input: Record<string, unknown>
  result?: string
  isError?: boolean
  pending?: boolean
  rejected?: boolean
}

export type ChatMode = 'plan' | 'agent'

export function useChat() {
  const messages = ref<ChatMessageDisplay[]>([])
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const toolCalls = ref<ToolCallDisplay[]>([])
  const pendingApprovals = ref<ToolCallDisplay[]>([])
  const lastTokenUsage = ref<{
    inputTokens: number
    outputTokens: number
    cost: number
    tokensSaved: number
  } | null>(null)
  const error = ref<string | null>(null)

  function loadMessages(threadMessages: ChatMessageDisplay[]) {
    messages.value = threadMessages.filter(m => m.role === 'user' || m.role === 'assistant')
  }

  async function sendMessage(
    threadId: string,
    content: string,
    provider?: string,
    model?: string,
    mode: ChatMode = 'plan',
    approvedToolCalls?: string[]
  ) {
    error.value = null
    isStreaming.value = true
    streamingContent.value = ''
    toolCalls.value = []
    pendingApprovals.value = []

    // Save stream context for potential continuation after approvals
    _lastStreamContext = { threadId, provider, model, mode }

    // Add user message immediately
    messages.value.push({
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    })

    // Add placeholder for assistant
    messages.value.push({
      role: 'assistant',
      content: '',
      isStreaming: true,
    })

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content, provider, model, mode, approvedToolCalls }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ message: 'Stream error' }))
        throw new Error(errBody.message || `HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventName = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventName = line.slice(7).trim()
          } else if (line.startsWith('data: ') && eventName) {
            const data = JSON.parse(line.slice(6))
            handleSSEEvent(eventName, data)
            eventName = ''
          }
        }
      }
    } catch (err: any) {
      error.value = err.message
      // Remove streaming placeholder on error
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg?.isStreaming && !lastMsg.content) {
        messages.value.pop()
      }
    } finally {
      isStreaming.value = false
      // Finalize streaming message
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg?.isStreaming) {
        lastMsg.isStreaming = false
      }
    }
  }

  function handleSSEEvent(eventName: string, data: any) {
    const lastMsg = messages.value[messages.value.length - 1]

    switch (eventName) {
      case 'text_delta':
        streamingContent.value += data.content
        if (lastMsg?.isStreaming) {
          lastMsg.content += data.content
        }
        break

      case 'tool_call':
        toolCalls.value.push({
          id: data.id,
          name: data.name,
          input: data.input,
        })
        break

      case 'tool_approval_request': {
        // Update existing entry from tool_call event (don't add duplicate)
        const existing = toolCalls.value.find(t => t.id === data.id)
        if (existing) {
          existing.pending = true
        } else {
          toolCalls.value.push({
            id: data.id,
            name: data.name,
            input: data.input,
            pending: true,
          })
        }
        pendingApprovals.value.push({
          id: data.id,
          name: data.name,
          input: data.input,
          pending: true,
        })
        break
      }

      case 'tool_result': {
        const tc = toolCalls.value.find(t => t.id === data.id)
        if (tc) {
          tc.result = data.content
          tc.isError = data.isError
          if (data.pending) tc.pending = true
        }
        break
      }

      case 'awaiting_approval':
        // Stream paused, waiting for user to approve/reject
        break

      case 'message_complete':
        if (lastMsg?.isStreaming) {
          lastMsg.id = data.messageId
          lastMsg.isStreaming = false
        }
        lastTokenUsage.value = data.tokenUsage
        break

      case 'error':
        error.value = data.message
        break

      case 'summary_stale':
        break
    }
  }

  // State for auto-continuation after all approvals resolved
  let _lastStreamContext: {
    threadId: string
    provider?: string
    model?: string
    mode: ChatMode
  } | null = null

  async function approveTool(threadId: string, toolCallId: string, approved: boolean) {
    try {
      const result = await $fetch<{
        success: boolean
        rejected: boolean
        content: string
        isError?: boolean
      }>('/api/chat/approve-tool', {
        method: 'POST',
        body: { threadId, toolCallId, approved },
      })

      // Update the tool call display
      const tc = toolCalls.value.find(t => t.id === toolCallId)
      if (tc) {
        tc.pending = false
        tc.rejected = !approved
        tc.result = result.content
        tc.isError = result.isError || false
      }

      // Remove from pending
      pendingApprovals.value = pendingApprovals.value.filter(t => t.id !== toolCallId)

      // If all pending approvals are resolved AND at least one was approved,
      // automatically continue the AI conversation
      if (pendingApprovals.value.length === 0 && _lastStreamContext) {
        const hasApproved = toolCalls.value.some(t => !t.pending && !t.rejected && t.result)
        if (hasApproved) {
          const ctx = _lastStreamContext
          _lastStreamContext = null
          await continueAfterApprovals(ctx.threadId, ctx.provider, ctx.model, ctx.mode)
        }
      }

      return result
    } catch (err: any) {
      error.value = err.message
      return null
    }
  }

  async function continueAfterApprovals(
    threadId: string,
    provider?: string,
    model?: string,
    mode: ChatMode = 'agent',
  ) {
    isStreaming.value = true
    streamingContent.value = ''
    error.value = null

    // Clear resolved tool calls and add streaming placeholder for new AI response
    toolCalls.value = []
    messages.value.push({
      role: 'assistant',
      content: '',
      isStreaming: true,
    })

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          content: '__continue__',
          provider,
          model,
          mode,
          continueAfterApproval: true,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ message: 'Stream error' }))
        throw new Error(errBody.message || `HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventName = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventName = line.slice(7).trim()
          } else if (line.startsWith('data: ') && eventName) {
            const data = JSON.parse(line.slice(6))
            handleSSEEvent(eventName, data)
            eventName = ''
          }
        }
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      isStreaming.value = false
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg?.isStreaming) {
        lastMsg.isStreaming = false
      }
    }
  }

  async function togglePin(messageId: string, isPinned: boolean) {
    await $fetch(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: { isPinned },
    })
    const msg = messages.value.find(m => m.id === messageId)
    if (msg) msg.isPinned = isPinned
  }

  function clear() {
    messages.value = []
    streamingContent.value = ''
    toolCalls.value = []
    pendingApprovals.value = []
    lastTokenUsage.value = null
    error.value = null
  }

  return {
    messages,
    isStreaming,
    streamingContent,
    toolCalls,
    pendingApprovals,
    lastTokenUsage,
    error,
    loadMessages,
    sendMessage,
    approveTool,
    togglePin,
    clear,
  }
}
