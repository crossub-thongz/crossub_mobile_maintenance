export type ApiMaintenanceStatus =
  | 'under_review'
  | 'pending_quotation'
  | 'pending_approval'
  | 'in_progress'
  | 'completed'
  | 'closed';

export type ApiMaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type ApiMaintenanceUserRole =
  | 'tenant'
  | 'agent'
  | 'admin'
  | 'contractor'
  | 'strata';

export interface ApiMaintenanceParty {
  name: string;
  email?: string;
  phone?: string;
}

export interface ApiContractor {
  id: string;
  name: string;
  type: 'internal' | 'external';
  serviceTypes: string[];
  rating: number;
  distanceKm?: number;
  email?: string;
  phone?: string;
  isBlacklisted?: boolean;
}

export interface ApiQuotation {
  id: string;
  maintenanceRequestId: string;
  contractorId: string;
  price: number;
  currency: 'AUD';
  scope: string;
  availableSchedule: string;
  submittedAt: string;
  status: 'submitted' | 'approved' | 'declined';
  declineReason?: string;
  previousQuotationId?: string;
}

export interface ApiMaintenanceRequest {
  id: string;
  issueType: string;
  description: string;
  address: string;
  priority: ApiMaintenancePriority;
  responsibility?: 'tenant' | 'landlord' | 'strata';
  status: ApiMaintenanceStatus;
  createdAt: string;
  dueAt: string;
  source: 'tenant_app' | 'agent_submission' | 'email';
  tenant?: ApiMaintenanceParty;
  agent?: ApiMaintenanceParty;
  assignedContractorId?: string;
  quotationIds: string[];
  completionEvidenceUploaded?: boolean;
  tenantApprovalReceived?: boolean;
  invoiceUploaded?: boolean;
  timeline: { status: ApiMaintenanceStatus; enteredAt: string; exitedAt?: string }[];
}

export interface ApiMaintenanceAuditLogEntry {
  id: string;
  maintenanceRequestId: string;
  action: string;
  message: string;
  actor: 'system' | 'admin' | 'agent' | 'contractor';
  timestamp: string;
}

export interface ApiMaintenanceNotification {
  id: string;
  maintenanceRequestId: string;
  channel: 'in_app' | 'email';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ApiMaintenanceState {
  maintenanceRequests: ApiMaintenanceRequest[];
  contractors: ApiContractor[];
  quotations: ApiQuotation[];
  maintenanceAuditLog: ApiMaintenanceAuditLogEntry[];
  maintenanceNotifications: ApiMaintenanceNotification[];
  maintenanceReminders?: {
    id: string;
    maintenanceRequestId: string;
    type: 'reminder' | 'escalation';
    dueAt: string;
  }[];
  maintenanceAttachments?: {
    id: string;
    maintenanceRequestId: string;
    kind: string;
    fileName: string;
  }[];
  lastMaintenanceError?: string | null;
}
