export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as any).response?.data?.message
    if (Array.isArray(message)) return message[0]
    if (typeof message === 'string') return message
  }
  return 'Đã có lỗi xảy ra, vui lòng thử lại'
}
