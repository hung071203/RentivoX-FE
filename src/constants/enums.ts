export const ROOM_TYPE_LABEL: Record<string, string> = {
  shared: 'Phòng ghép',
  private: 'Nguyên căn',
}

export const ROOM_STATUS_LABEL: Record<string, string> = {
  available: 'Còn trống',
  occupied: 'Đang thuê',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt',
}

export const CONTRACT_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hiệu lực',
  expired: 'Hết hạn',
  terminated: 'Đã chấm dứt',
}

export const SERVICE_TYPE_LABEL: Record<string, string> = {
  metered: 'Đo đếm',
  fixed: 'Cố định',
}

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
  cancelled: 'Đã huỷ',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  other: 'Khác',
}

export const USER_ROLE_LABEL: Record<string, string> = {
  super_admin: 'Quản trị viên cấp cao',
  admin: 'Quản trị viên',
  landlord: 'Chủ trọ',
  tenant: 'Người thuê',
}
