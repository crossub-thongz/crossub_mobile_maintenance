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
  COMM_CHANNEL,
  COMM_CHANNEL_TO_MESSAGE,
  COMM_USER_TYPE_TO_ROLE,
  CONTRACTOR_NOTIFICATION_TYPE_TO_FE,
  MAINTENANCE_STATUS,
} from '@/constants/api-enums';
import type {
  ContractorJobStatus,
  ContractorNotification,
  JobBucket,
  JobContact,
  MaintenanceJob,
  MessageThread,
  Priority,
  ThreadMessage,
} from '@/lib/types';

import type {
  ContractorJob,
  ContractorMessageThread,
  ContractorNotificationDto,
} from './contractor-client';

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

/**
 * Derive a thread's channel badge (`'app' | 'email' | 'mixed'`) from its messages'
 * per-message channels. All-app reads `'app'`, all-email `'email'`, a blend `'mixed'`;
 * an empty thread defaults to `'app'`.
 */
function threadChannel(thread: ContractorMessageThread): MessageThread['channel'] {
  const hasEmail = thread.messages.some((m) => m.channel === COMM_CHANNEL.EMAIL);
  const hasNonEmail = thread.messages.some((m) => m.channel !== COMM_CHANNEL.EMAIL);
  if (hasEmail && hasNonEmail) return 'mixed';
  if (hasEmail) return 'email';
  return 'app';
}

/** Project one contractor-facade message into the app's ThreadMessage shape. */
function toThreadMessage(
  m: ContractorMessageThread['messages'][number],
): ThreadMessage {
  return {
    id: m.id,
    at: m.at,
    from: m.from,
    fromRole: COMM_USER_TYPE_TO_ROLE[m.userType] ?? 'crossub',
    body: m.body,
    channel: COMM_CHANNEL_TO_MESSAGE[m.channel] ?? 'app',
  };
}

/**
 * Project one contractor-facade message thread onto the app's MessageThread view-model.
 * The DTO carries clean `T | null` scalars; the view-model wants non-null display
 * strings, so the address/last-message/last-at fall back to sensible blanks.
 */
export function toMessageThread(thread: ContractorMessageThread): MessageThread {
  return {
    id: thread.id,
    jobId: asString(thread.jobId) ?? undefined,
    jobTrackingNumber: asString(thread.jobTrackingNumber) ?? undefined,
    propertyAddress: asString(thread.propertyAddress) ?? '—',
    subject: thread.subject,
    participants: thread.participants,
    lastMessage: asString(thread.lastMessage) ?? '',
    lastAt: asString(thread.lastAt) ?? '',
    unread: thread.unread,
    channel: threadChannel(thread),
    messages: thread.messages.map(toThreadMessage),
  };
}

/** Map the contractor's message threads onto the app's MessageThread view-models. */
export function mapContractorMessageThreads(
  threads: ContractorMessageThread[],
): MessageThread[] {
  return threads.map(toMessageThread);
}

/** Project one contractor-facade notification onto the app's ContractorNotification. */
export function toContractorNotification(
  n: ContractorNotificationDto,
): ContractorNotification {
  return {
    id: n.id,
    type: CONTRACTOR_NOTIFICATION_TYPE_TO_FE[n.type] ?? 'message',
    title: n.title,
    body: n.body,
    jobTrackingNumber: asString(n.jobTrackingNumber) ?? undefined,
    at: n.at,
    read: n.read,
    href: n.href,
  };
}

/** Map the contractor's notifications onto the app's ContractorNotification view-models. */
export function mapContractorNotifications(
  notifications: ContractorNotificationDto[],
): ContractorNotification[] {
  return notifications.map(toContractorNotification);
}
