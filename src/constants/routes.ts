export const ROUTES = {
  LOGIN: '/login',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',

  // Landlord (no prefix — main user)
  DASHBOARD: '/dashboard',
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: (id: string) => `/properties/${id}`,
  ROOMS: '/rooms',
  TENANTS: '/tenants',
  CONTRACTS: '/contracts',
  SERVICES: '/services',
  METER_READINGS: '/meter-readings',
  INVOICES: '/invoices',
  PAYMENTS: '/payments',

  // Tenant
  TENANT_DASHBOARD: '/tenant/dashboard',
  TENANT_ROOM: '/tenant/room',
  TENANT_CONTRACTS: '/tenant/contracts',
  TENANT_INVOICES: '/tenant/invoices',
  TENANT_PAYMENTS: '/tenant/payments',
} as const

export const ROLE_HOME = {
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  landlord: '/dashboard',
  tenant: '/tenant/dashboard',
} as const
