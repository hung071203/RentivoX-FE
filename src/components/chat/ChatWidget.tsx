'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Bot, X, Send, RotateCcw, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { streamChat } from '@/apis/chat.api'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'ai'

interface Message {
  id: string
  role: Role
  text: string
  streaming?: boolean
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex gap-2 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap break-words">{msg.text}</span>
        ) : (
          <div className="min-w-0 break-words text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5">{children}</h3>,
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-1 pl-5 list-disc space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 pl-5 list-decimal space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  return isBlock ? (
                    <code className="block bg-black/10 rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre my-1">{children}</code>
                  ) : (
                    <code className="bg-black/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                  )
                },
                pre: ({ children }) => <pre className="my-1 overflow-x-auto">{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-current/30 pl-3 my-1 italic opacity-80">{children}</blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{children}</a>
                ),
                hr: () => <hr className="my-2 border-current/20" />,
                table: ({ children }) => (
                  <div className="my-1 overflow-x-auto">
                    <table className="text-xs border-collapse w-full">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="font-semibold border border-current/20 px-2 py-1 text-left bg-black/5">{children}</th>,
                td: ({ children }) => <td className="border border-current/20 px-2 py-1">{children}</td>,
              }}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
        )}
        {msg.streaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current align-middle animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}

// ─── Main widget ─────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [interactionId, setInteractionId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Re-focus textarea after AI finishes responding
  useEffect(() => {
    if (!isLoading && isOpen) {
      textareaRef.current?.focus()
    }
  }, [isLoading, isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          text: 'Xin chào! Tôi là trợ lý AI của RentivoX. Tôi có thể giúp bạn quản lý nhà trọ, tra cứu thông tin hóa đơn, hợp đồng và nhiều hơn nữa. Bạn cần hỗ trợ gì?',
        },
      ])
    }
  }

  const handleClose = () => {
    abortRef.current?.abort()
    setIsOpen(false)
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setMessages([])
    setInteractionId(undefined)
    setIsLoading(false)
    setInput('')
    // Re-show welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'ai',
        text: 'Xin chào! Tôi là trợ lý AI của RentivoX. Tôi có thể giúp bạn quản lý nhà trọ, tra cứu thông tin hóa đơn, hợp đồng và nhiều hơn nữa. Bạn cần hỗ trợ gì?',
      },
    ])
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setIsLoading(true)

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text }
    const aiMsgId = crypto.randomUUID()
    const aiMsg: Message = { id: aiMsgId, role: 'ai', text: '', streaming: true }

    setMessages((prev) => [...prev, userMsg, aiMsg])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamChat(
        text,
        interactionId,
        (event) => {
          if (event.type === 'chunk') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, text: m.text + event.text } : m,
              ),
            )
          } else if (event.type === 'done') {
            setInteractionId(event.interactionId)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, streaming: false } : m,
              ),
            )
          } else if (event.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, text: `Có lỗi xảy ra: ${event.message}`, streaming: false }
                  : m,
              ),
            )
          }
        },
        controller.signal,
      )
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, text: 'Không thể kết nối tới trợ lý AI. Vui lòng thử lại.', streaming: false }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, interactionId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[380px] flex flex-col rounded-2xl shadow-2xl border bg-background overflow-hidden"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Trợ lý AI</p>
              <p className="text-xs text-primary-foreground/70 leading-tight">RentivoX Assistant</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              onClick={handleReset}
              title="Cuộc hội thoại mới"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t bg-background shrink-0">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi... (Enter để gửi)"
                rows={1}
                className={cn(
                  'flex-1 resize-none min-h-[38px] max-h-[120px] text-sm py-2 overflow-y-auto',
                  isLoading && 'opacity-60',
                )}
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
              <Button
                size="icon"
                className="h-[38px] w-[38px] shrink-0"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 text-center">
              Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
        )}
        title="Trợ lý AI"
        style={{ width: '52px', height: '52px' }}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </button>
    </>
  )
}
