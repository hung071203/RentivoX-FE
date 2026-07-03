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
  active: 'Đang hiệu lực',
  expired: 'Hết hạn',
  terminated: 'Đã chấm dứt',
}

export const AMENDMENT_TYPE_LABEL: Record<string, string> = {
  renewal: 'Gia hạn',
  price_adjustment: 'Điều chỉnh giá',
  general: 'Khác',
}

export const SERVICE_TYPE_LABEL: Record<string, string> = {
  metered: 'Đo đếm',
  fixed: 'Cố định',
}

export const VEHICLE_TYPE_LABEL: Record<string, string> = {
  motorbike: 'Xe máy',
  car: 'Ô tô',
  bicycle: 'Xe đạp',
  other: 'Khác',
}

export const SERVICE_UNIT_PRESETS: string[] = [
  'kWh',
  'Khối',
  'Tháng',
  'Người',
  'Chiếc',
  'Lần',
  'Cái',
  'Bình',
  'm2',
  'Giờ',
]

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
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

export const GENDER_LABEL: Record<string, string> = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
}

export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  invoice_created: 'Hóa đơn mới',
  invoice_paid: 'Hóa đơn thanh toán',
  invoice_due_soon: 'Hóa đơn sắp đến hạn',
  contract_expiring_soon: 'Hợp đồng sắp hết hạn',
  contract_expired: 'Hợp đồng hết hạn',
  contract_terminated: 'Hợp đồng chấm dứt',
  amendment_applied: 'Phụ lục áp dụng',
  payment_recorded: 'Ghi nhận thanh toán',
  system_announcement: 'Thông báo hệ thống',
}
