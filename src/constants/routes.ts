export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  PROFILE: '/profile',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_PROPERTIES: '/admin/properties',

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
  VEHICLES: '/vehicles',

  // Tenant
  TENANT_DASHBOARD: '/tenant/dashboard',
  TENANT_ROOM: '/tenant/room',
  TENANT_CONTRACTS: '/tenant/contracts',
  TENANT_INVOICES: '/tenant/invoices',
  TENANT_PAYMENTS: '/tenant/payments',
  TENANT_VEHICLES: '/tenant/vehicles',
} as const

export const ROLE_HOME = {
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  landlord: '/dashboard',
  tenant: '/tenant/dashboard',
} as const
