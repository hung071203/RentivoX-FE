import { getToken } from '@/utils/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'

export type ChatStreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; interactionId: string }
  | { type: 'error'; message: string }

export async function streamChat(
  input: string,
  previousInteractionId: string | undefined,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getToken()

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ input, previousInteractionId }),
    signal,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? 'Yêu cầu thất bại')
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw) continue
      try {
        onEvent(JSON.parse(raw) as ChatStreamEvent)
      } catch {
        // ignore malformed chunks
      }
    }
  }
}
