import api from '@/lib/axios'
import type {
  Notification,
  GetNotificationsParams,
  NotificationsPage,
  BroadcastNotificationPayload,
} from '@/types/notification.types'

export const notificationsApi = {
  getAll: (params?: GetNotificationsParams) =>
    api.get<NotificationsPage>('/notifications', { params }).then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string) =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.patch<void>('/notifications/read-all').then((r) => r.data),

  broadcast: (payload: BroadcastNotificationPayload) =>
    api.post<void>('/admin/notifications/broadcast', payload).then((r) => r.data),
}
