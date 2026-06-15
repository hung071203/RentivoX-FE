export const ROUTES = {
  LOGIN: '/login',
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: (id: string) => `/properties/${id}`,
  ROOMS: '/rooms',
  TENANTS: '/tenants',
  CONTRACTS: '/contracts',
  SERVICES: '/services',
  METER_READINGS: '/meter-readings',
  INVOICES: '/invoices',
  PAYMENTS: '/payments',
} as const
