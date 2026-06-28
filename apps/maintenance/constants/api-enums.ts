/**
 * Runtime mirrors of the CROSSUB API's Prisma enums. The typed contract
 * (`@crossub-thongz/api-contract`) ships these as string-literal *types* only — there
 * are no runtime values to compare against — so the mappers import these constants
 * instead of hard-coding raw strings (per the repo's "no raw string comparisons" rule).
 *
 * Keep in sync with `apps/api/prisma/schema.prisma`.
 */

/** MaintenanceStatus — the real persisted lifecycle of a MaintenanceRequest. */
export const MAINTENANCE_STATUS = {
  OPEN: 'OPEN',
  APPROVED: 'APPROVED',
  QUOTING: 'QUOTING',
  SCHEDULED: 'SCHEDULED',
  INVOICED: 'INVOICED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

/** MaintenanceOrderType — what kind of work the request represents. */
export const MAINTENANCE_ORDER_TYPE = {
  TENANT_REQUEST: 'TENANT_REQUEST',
  PROPERTY_MAINTENANCE: 'PROPERTY_MAINTENANCE',
  STRATA: 'STRATA',
  UNKNOWN: 'UNKNOWN',
} as const;

/** CommUserType — the role of a message sender on a CommConversation. */
export const COMM_USER_TYPE = {
  INTERNAL: 'INTERNAL',
  AGENT: 'AGENT',
  LANDLORD: 'LANDLORD',
  TENANT: 'TENANT',
  CONTRACTOR: 'CONTRACTOR',
  INSPECTOR: 'INSPECTOR',
} as const;

/** CommChannel — the medium a CommMessage was sent over. */
export const COMM_CHANNEL = {
  APP: 'APP',
  EMAIL: 'EMAIL',
  VOICE: 'VOICE',
  INTERNAL_NOTE: 'INTERNAL_NOTE',
  PUSH: 'PUSH',
} as const;

/**
 * Map a sender's `CommUserType` onto the contractor app's `ThreadMessage.fromRole`
 * union (`'contractor' | 'tenant' | 'agent' | 'crossub'`). The app's union has no
 * LANDLORD/INSPECTOR member, so both — and INTERNAL — fold to `'crossub'` (a thread a
 * contractor sees is, in practice, with the tenant, the managing agent, or CROSSUB).
 */
export const COMM_USER_TYPE_TO_ROLE: Record<
  string,
  'contractor' | 'tenant' | 'agent' | 'crossub'
> = {
  [COMM_USER_TYPE.CONTRACTOR]: 'contractor',
  [COMM_USER_TYPE.TENANT]: 'tenant',
  [COMM_USER_TYPE.AGENT]: 'agent',
  [COMM_USER_TYPE.INTERNAL]: 'crossub',
  [COMM_USER_TYPE.LANDLORD]: 'crossub',
  [COMM_USER_TYPE.INSPECTOR]: 'crossub',
};

/**
 * Map a `CommChannel` onto the app's per-message channel (`'app' | 'email'`). Only APP
 * and EMAIL are surfaced to the contractor; the others (voice/internal-note/push) fall
 * back to `'app'`.
 */
export const COMM_CHANNEL_TO_MESSAGE: Record<string, 'app' | 'email'> = {
  [COMM_CHANNEL.APP]: 'app',
  [COMM_CHANNEL.EMAIL]: 'email',
};

/** ContractorNotificationType — the kind of a contractor notification. */
export const CONTRACTOR_NOTIFICATION_TYPE = {
  JOB_ASSIGNED: 'JOB_ASSIGNED',
  QUOTE_UPDATE: 'QUOTE_UPDATE',
  PAYMENT: 'PAYMENT',
  REMINDER: 'REMINDER',
  MESSAGE: 'MESSAGE',
} as const;

/**
 * Map the API's `ContractorNotificationType` onto the app's lowercase
 * `ContractorNotification.type` union — a 1:1 lowercasing of the enum members.
 */
export const CONTRACTOR_NOTIFICATION_TYPE_TO_FE: Record<
  string,
  'job_assigned' | 'quote_update' | 'payment' | 'reminder' | 'message'
> = {
  [CONTRACTOR_NOTIFICATION_TYPE.JOB_ASSIGNED]: 'job_assigned',
  [CONTRACTOR_NOTIFICATION_TYPE.QUOTE_UPDATE]: 'quote_update',
  [CONTRACTOR_NOTIFICATION_TYPE.PAYMENT]: 'payment',
  [CONTRACTOR_NOTIFICATION_TYPE.REMINDER]: 'reminder',
  [CONTRACTOR_NOTIFICATION_TYPE.MESSAGE]: 'message',
};
