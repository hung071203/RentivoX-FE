import dayjs from 'dayjs'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function formatDate(date: string | Date, fmt = 'DD/MM/YYYY'): string {
  return dayjs(date).format(fmt)
}

export function formatMonth(date: string | Date): string {
  return dayjs(date).format('MM/YYYY')
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('HH:mm DD/MM/YYYY')
}
