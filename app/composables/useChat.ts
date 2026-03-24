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
}

export function useChat() {
  const messages = ref<ChatMessageDisplay[]>([])
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const toolCalls = ref<ToolCallDisplay[]>([])
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

  async function sendMessage(threadId: string, content: string, provider?: string, model?: string) {
    error.value = null
    isStreaming.value = true
    streamingContent.value = ''
    toolCalls.value = []

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
        body: JSON.stringify({ threadId, content, provider, model }),
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

      case 'tool_result': {
        const tc = toolCalls.value.find(t => t.id === data.id)
        if (tc) {
          tc.result = data.content
          tc.isError = data.isError
        }
        break
      }

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
        // Could emit an event or set a flag
        break
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
    lastTokenUsage.value = null
    error.value = null
  }

  return {
    messages,
    isStreaming,
    streamingContent,
    toolCalls,
    lastTokenUsage,
    error,
    loadMessages,
    sendMessage,
    togglePin,
    clear,
  }
}
