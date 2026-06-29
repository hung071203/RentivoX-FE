export type NotificationType =
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_due_soon'
  | 'contract_expiring_soon'
  | 'contract_expired'
  | 'contract_terminated'
  | 'amendment_applied'
  | 'payment_recorded'
  | 'system_announcement'

export interface NotificationData {
  invoiceId?: string
  contractId?: string
  paymentId?: string
  amendmentId?: string
}

export interface Notification {
  id: string
  userId: string
  senderId: string | null
  type: NotificationType
  title: string
  message: string
  data: NotificationData | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface GetNotificationsParams {
  limit?: number
  lastCreatedAt?: string
  isRead?: boolean
}

export interface NotificationsPage {
  items: Notification[]
  hasMore: boolean
}

export interface BroadcastNotificationPayload {
  title: string
  message: string
  target: 'all' | 'landlord' | 'tenant'
}
