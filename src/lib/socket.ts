import type { Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(token: string): Socket | null {
  if (typeof window === 'undefined') return null
  if (socket?.connected) return socket

  // Dynamic require avoids SSR bundling issues with socket.io-client's Node.js deps
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { io } = require('socket.io-client') as typeof import('socket.io-client')

  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL ??
    (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api').replace(/\/api$/, '')

  socket = io(wsUrl, {
    auth: { token },
    transports: ['websocket'],
  })

  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

export function getSocket(): Socket | null {
  return socket
}
