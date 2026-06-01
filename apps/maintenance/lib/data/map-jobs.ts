import type {
  ApiContractor,
  ApiMaintenanceAuditLogEntry,
  ApiMaintenanceNotification,
  ApiMaintenanceRequest,
  ApiQuotation,
} from '@/lib/crossub-api/types';
import type {
  ContractorJobStatus,
  JobBucket,
  MaintenanceJob,
  Priority,
  TimelineEntry,
} from '@/lib/types';
import { jobDetail } from '@/constants/routes';

const CONTRACTOR_ID = 'contractor-demo-1';

function auditToTimeline(entries: ApiMaintenanceAuditLogEntry[]): TimelineEntry[] {
  return entries.map((e) => ({
    id: e.id,
    at: e.timestamp,
    actor:
      e.actor === 'agent'
        ? 'Agent'
        : e.actor === 'contractor'
          ? 'Contractor'
          : 'CROSSUB',
    actorRole:
      e.actor === 'agent'
        ? 'agent'
        : e.actor === 'contractor'
          ? 'contractor'
          : 'crossub',
    title: e.message,
    source: e.actor === 'system' ? 'system' : 'app',
  }));
}

function mapPriority(p: string): Priority {
  if (p === 'critical') return 'critical';
  if (p === 'high') return 'high';
  if (p === 'low') return 'low';
  return 'medium';
}

function deriveBucket(
  req: ApiMaintenanceRequest,
  quote?: ApiQuotation,
): JobBucket {
  if (req.invoiceUploaded && req.tenantApprovalReceived) return 'pending_payment';
  if (req.status === 'completed' && !req.tenantApprovalReceived) {
    return 'awaiting_tenant_confirmation';
  }
  if (req.status === 'in_progress') return 'in_progress';
  if (req.status === 'pending_approval' && quote?.status === 'submitted') {
    return 'awaiting_quotation_approval';
  }
  if (quote?.status === 'approved') return 'approved_jobs';
  if (req.status === 'closed') return 'paid_jobs';
  if (!req.assignedContractorId) return 'pending_jobs';
  return 'pending_jobs';
}

function deriveStatus(
  req: ApiMaintenanceRequest,
  quote?: ApiQuotation,
): ContractorJobStatus {
  if (req.status === 'closed') return 'closed';
  if (req.invoiceUploaded) return 'invoice_submitted';
  if (req.status === 'completed' && !req.tenantApprovalReceived) {
    return 'awaiting_tenant_confirmation';
  }
  if (req.status === 'in_progress') return 'in_progress';
  if (quote?.status === 'approved') return 'approved';
  if (quote?.status === 'submitted') return 'awaiting_quotation_approval';
  if (req.assignedContractorId === CONTRACTOR_ID) return 'accepted';
  return 'assigned';
}

export interface MappedJob extends MaintenanceJob {
  source: 'api';
  apiContractorId?: string;
  submittedQuotationId?: string;
}

export function mapApiJob(
  req: ApiMaintenanceRequest,
  contractors: ApiContractor[],
  quotations: ApiQuotation[],
  auditLog: ApiMaintenanceAuditLogEntry[],
): MappedJob | null {
  const isAssigned =
    req.assignedContractorId === CONTRACTOR_ID ||
    quotations.some(
      (q) =>
        q.maintenanceRequestId === req.id && q.contractorId === CONTRACTOR_ID,
    );

  if (!isAssigned && req.status !== 'pending_quotation') return null;

  const quote = quotations.find(
    (q) =>
      q.maintenanceRequestId === req.id && q.contractorId === CONTRACTOR_ID,
  );
  const reqAudit = auditLog.filter((a) => a.maintenanceRequestId === req.id);

  return {
    id: req.id,
    trackingNumber: `MR-${req.id.slice(0, 8).toUpperCase()}`,
    propertyAddress: req.address,
    issueSummary: req.issueType,
    description: req.description,
    category: req.issueType,
    priority: mapPriority(req.priority),
    status: deriveStatus(req, quote),
    bucket: deriveBucket(req, quote),
    submittedAt: req.createdAt,
    slaDueAt: req.dueAt,
    tenant: {
      name: req.tenant?.name ?? 'Tenant',
      email: req.tenant?.email,
      phone: req.tenant?.phone,
    },
    agent: {
      name: req.agent?.name ?? 'Agent',
      email: req.agent?.email,
      phone: req.agent?.phone,
    },
    crossubContact: {
      name: 'CROSSUB Maintenance',
      email: 'maintenance@crossub.com',
      phone: '1300 CROSSUB',
    },
    photos: [],
    contractorResponse: req.assignedContractorId === CONTRACTOR_ID ? 'accepted' : undefined,
    quotation: quote
      ? {
          id: quote.id,
          jobId: req.id,
          labourCost: quote.price * 0.6,
          materialCost: quote.price * 0.4,
          totalAmount: quote.price,
          scope: quote.scope,
          estimatedCompletion: quote.availableSchedule,
          status:
            quote.status === 'declined'
              ? 'declined'
              : quote.status === 'approved'
                ? 'approved'
                : 'submitted',
          declineReason: quote.declineReason,
          submittedAt: quote.submittedAt,
        }
      : undefined,
    completionEvidenceUploaded: !!req.completionEvidenceUploaded,
    tenantConfirmed: !!req.tenantApprovalReceived,
    invoiceUploaded: !!req.invoiceUploaded,
    paymentStatus: req.invoiceUploaded ? 'invoice_submitted' : undefined,
    timeline: auditToTimeline(reqAudit),
    source: 'api',
    apiContractorId: CONTRACTOR_ID,
    submittedQuotationId: quote?.status === 'submitted' ? quote.id : undefined,
  };
}

export function mapAllApiJobs(state: {
  requests: ApiMaintenanceRequest[];
  contractors: ApiContractor[];
  quotations: ApiQuotation[];
  auditLog: ApiMaintenanceAuditLogEntry[];
}): MappedJob[] {
  return state.requests
    .map((req) =>
      mapApiJob(req, state.contractors, state.quotations, state.auditLog),
    )
    .filter((j): j is MappedJob => j !== null);
}

export function notificationsToContractor(
  notifications: ApiMaintenanceNotification[],
  requests: ApiMaintenanceRequest[],
) {
  return notifications.map((n) => {
    const req = requests.find((r) => r.id === n.maintenanceRequestId);
    return {
      id: n.id,
      type: n.title.toLowerCase().includes('payment')
        ? ('payment' as const)
        : n.title.toLowerCase().includes('quotation')
          ? ('quote_update' as const)
          : n.title.toLowerCase().includes('assigned')
            ? ('job_assigned' as const)
            : ('reminder' as const),
      title: n.title,
      body: n.message,
      jobTrackingNumber: req
        ? `MR-${req.id.slice(0, 8).toUpperCase()}`
        : undefined,
      at: n.createdAt,
      read: n.read,
      href: jobDetail(n.maintenanceRequestId),
      source: 'api' as const,
    };
  });
}

export { CONTRACTOR_ID };
