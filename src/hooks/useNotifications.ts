'use client'
import { useEffect } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationsApi } from '@/apis/notifications.api'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { getToken } from '@/utils/auth'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { getErrorMessage } from '@/utils/error'
import type { GetNotificationsParams, BroadcastNotificationPayload } from '@/types/notification.types'

const NOTI_KEY = 'notifications'
const UNREAD_KEY = 'notifications-unread-count'
const LIMIT = 15

export function useInfiniteNotifications(params?: Omit<GetNotificationsParams, 'lastCreatedAt'>) {
  return useInfiniteQuery({
    queryKey: [NOTI_KEY, params],
    queryFn: ({ pageParam }) =>
      notificationsApi.getAll({
        ...params,
        limit: LIMIT,
        lastCreatedAt: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined
      return lastPage.items[lastPage.items.length - 1]?.createdAt
    },
    initialPageParam: undefined as string | undefined,
  })
}

export function useUnreadCount() {
  const { setUnreadCount } = useNotificationStore()
  return useQuery({
    queryKey: [UNREAD_KEY],
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount()
      setUnreadCount(res.count)
      return res
    },
    staleTime: 1000 * 30,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  const { setUnreadCount, unreadCount } = useNotificationStore()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTI_KEY] })
      setUnreadCount(Math.max(0, unreadCount - 1))
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  const { resetUnread } = useNotificationStore()
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTI_KEY] })
      resetUnread()
      toast.success('Đã đọc tất cả thông báo')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useBroadcastNotification() {
  return useMutation({
    mutationFn: (payload: BroadcastNotificationPayload) => notificationsApi.broadcast(payload),
    onSuccess: () => toast.success('Đã gửi thông báo thành công'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Khởi tạo socket — gọi trong component chỉ render cho landlord/tenant
export function useSocketInit() {
  const { user } = useAuthStore()
  const { incrementUnread } = useNotificationStore()
  const qc = useQueryClient()

  useEffect(() => {
    if (!user) return

    const token = getToken()
    if (!token) return

    const socket = connectSocket(token)
    if (!socket) return

    const handleNotification = () => {
      incrementUnread()
      qc.invalidateQueries({ queryKey: [NOTI_KEY] })
    }

    socket.on('notification', handleNotification)

    return () => {
      socket.off('notification', handleNotification)
      disconnectSocket()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
}
