export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  REGISTER: '/register',
  VERIFICATION: '/verification',
  SYSTEM_ACCESS_AGREEMENT: '/system-access-agreement',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.REGISTER,
] as const;

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number])) {
    return true;
  }
  return pathname.startsWith('/reset-password/');
}

export function jobDetail(id: string): string {
  return `${ROUTES.JOBS}/${id}`;
}

export function jobQuote(id: string): string {
  return `${ROUTES.JOBS}/${id}/quote`;
}

export function jobComplete(id: string): string {
  return `${ROUTES.JOBS}/${id}/complete`;
}

export function jobInvoice(id: string): string {
  return `${ROUTES.JOBS}/${id}/invoice`;
}

export function messageDetail(id: string): string {
  return `${ROUTES.MESSAGES}/${id}`;
}
