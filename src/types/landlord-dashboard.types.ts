export interface LandlordDashboardStats {
  rooms: {
    total: number
    available: number
    occupied: number
    maintenance: number
    reserved: number
    occupancyRate: number
  }
  activeContracts: number
  revenueThisMonth: {
    total: number
    paymentCount: number
  }
  unpaidInvoices: {
    count: number
    total: number
  }
  expiringContracts: ExpiringContract[]
  recentPayments: DashboardPayment[]
  monthlyRevenue: MonthlyRevenue[]
}

export interface ExpiringContract {
  id: string
  contractNumber: string | null
  endDate: string
  roomNumber: string
  propertyName: string
}

export interface DashboardPayment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceCode: string | null
  invoiceNumber: string
  period: string
  roomNumber: string
  propertyName: string
}

export interface MonthlyRevenue {
  month: string // YYYY-MM
  total: number
}
