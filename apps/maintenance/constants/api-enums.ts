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
