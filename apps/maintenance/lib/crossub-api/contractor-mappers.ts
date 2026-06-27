/**
 * Pure adapters from the typed CROSSUB contractor facade DTOs
 * (`@crossub-thongz/api-contract`) to the view-model the contractor screens already
 * render (`lib/types.ts` `MaintenanceJob`). Keeping the translation here means the
 * screens stay agnostic about where their data came from — the provider swaps demo
 * seeds for these mapped results with no component changes.
 *
 * The facade is a THIN projection of the real Prisma `MaintenanceRequest` (id, status,
 * type, urgent, description, category, property, dates). It deliberately carries no
 * tenant/agent contacts, audit timeline, or quote internals, so those view-model fields
 * land on safe placeholders — exactly what the screens already tolerate for demo data.
 */
import {
  MAINTENANCE_STATUS,
} from '@/constants/api-enums';
import type {
  ContractorJobStatus,
  JobBucket,
  JobContact,
  MaintenanceJob,
  Priority,
} from '@/lib/types';

import type { ContractorJob } from './contractor-client';

/**
 * The generated contract types nullable columns inconsistently — some surface as
 * `T | Record<string, never>` rather than `T | null` (an openapi-typescript rendering of
 * a `nullable: true` schema with no explicit `type`). So every scalar we read is funnelled
 * through this guard to land a clean string or null, never a stray `{}`.
 */
function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Map the real `MaintenanceStatus` onto the app's richer demo workflow (bucket + badge
 * status). The persisted model is simpler than the 7-stage demo board, so the mapping is
 * intentionally lossy — it keeps each job on a sensible board column and exposes the next
 * contractor action. `accept` drives APPROVED→SCHEDULED and `complete` SCHEDULED→COMPLETED,
 * so APPROVED reads as "assigned" (Accept/Decline shown) and SCHEDULED as "approved"
 * (Submit-quote / Upload-evidence shown).
 */
const JOB_VIEW: Record<
  ContractorJob['status'],
  { bucket: JobBucket; status: ContractorJobStatus }
> = {
  [MAINTENANCE_STATUS.OPEN]: { bucket: 'pending_jobs', status: 'assigned' },
  [MAINTENANCE_STATUS.APPROVED]: { bucket: 'pending_jobs', status: 'assigned' },
  [MAINTENANCE_STATUS.QUOTING]: {
    bucket: 'awaiting_quotation_approval',
    status: 'awaiting_quotation_approval',
  },
  [MAINTENANCE_STATUS.SCHEDULED]: { bucket: 'approved_jobs', status: 'approved' },
  [MAINTENANCE_STATUS.INVOICED]: {
    bucket: 'pending_payment',
    status: 'invoice_submitted',
  },
  [MAINTENANCE_STATUS.COMPLETED]: {
    bucket: 'awaiting_tenant_confirmation',
    status: 'awaiting_tenant_confirmation',
  },
  [MAINTENANCE_STATUS.CANCELLED]: { bucket: 'paid_jobs', status: 'closed' },
};

const FALLBACK_VIEW = { bucket: 'pending_jobs', status: 'assigned' } as const;

/** The thin facade has no priority — only an `urgent` flag. */
function toPriority(urgent: boolean): Priority {
  return urgent ? 'high' : 'medium';
}

/**
 * The facade carries no party contacts (those are staff-scoped). The screens render a
 * contact's phone/email only when present, so a name-only placeholder is safe.
 */
const PLACEHOLDER_TENANT: JobContact = { name: 'Tenant' };
const PLACEHOLDER_AGENT: JobContact = { name: 'Agent' };
const CROSSUB_CONTACT: JobContact = {
  name: 'CROSSUB Maintenance',
  email: 'maintenance@crossub.com',
  phone: '1300 CROSSUB',
};

/** Project one contractor-facade job onto the app's MaintenanceJob card. */
export function toMaintenanceJob(job: ContractorJob): MaintenanceJob {
  const view = JOB_VIEW[job.status] ?? FALLBACK_VIEW;
  const category = asString(job.categoryName) ?? 'General maintenance';
  const address =
    [asString(job.propertyAddress), asString(job.propertySuburb)]
      .filter((part): part is string => part !== null)
      .join(', ') || '—';
  const done =
    job.status === MAINTENANCE_STATUS.COMPLETED ||
    job.status === MAINTENANCE_STATUS.INVOICED;
  const invoiced = job.status === MAINTENANCE_STATUS.INVOICED;

  return {
    id: job.id,
    trackingNumber:
      asString(job.orderNumber) ?? `MR-${job.id.slice(0, 8).toUpperCase()}`,
    propertyAddress: address,
    issueSummary: category,
    description: asString(job.description) ?? '',
    category,
    priority: toPriority(job.urgent),
    status: view.status,
    bucket: view.bucket,
    submittedAt: asString(job.createdAt) ?? '',
    slaDueAt: undefined,
    tenant: PLACEHOLDER_TENANT,
    agent: PLACEHOLDER_AGENT,
    crossubContact: CROSSUB_CONTACT,
    photos: [],
    completionEvidenceUploaded: done,
    tenantConfirmed: false,
    invoiceUploaded: invoiced,
    paymentStatus: invoiced ? 'invoice_submitted' : undefined,
    appointmentAt: asString(job.scheduledDate) ?? undefined,
    timeline: [],
    source: 'api',
  };
}

/** Map a page of contractor-facade jobs onto the app's MaintenanceJob cards. */
export function mapContractorJobs(jobs: ContractorJob[]): MaintenanceJob[] {
  return jobs.map(toMaintenanceJob);
}
