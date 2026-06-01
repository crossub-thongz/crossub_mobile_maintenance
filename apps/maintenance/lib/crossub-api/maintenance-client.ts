import { api } from '@/lib/api';
import type {
  ApiMaintenanceState,
  ApiMaintenanceUserRole,
} from '@/lib/crossub-api/types';

export async function fetchMaintenanceState(): Promise<ApiMaintenanceState> {
  return api.get<ApiMaintenanceState>('/maintenance/state');
}

export async function fetchMaintenanceKpis(role: ApiMaintenanceUserRole = 'contractor') {
  return api.get<{ total: number; overdue: number; breachRate: number }>(
    `/maintenance/kpis?role=${role}`,
  );
}

export async function createQuotation(body: {
  maintenanceRequestId: string;
  contractorId: string;
  price: number;
  currency: 'AUD';
  scope: string;
  availableSchedule: string;
  actorRole: ApiMaintenanceUserRole;
}): Promise<ApiMaintenanceState> {
  return api.post<ApiMaintenanceState>('/maintenance/quotations/create', body);
}

export async function transitionJobStatus(body: {
  requestId: string;
  toStatus: string;
  actorRole: ApiMaintenanceUserRole;
}): Promise<ApiMaintenanceState> {
  return api.post<ApiMaintenanceState>('/maintenance/transition-status', body);
}

export async function setCompletionEvidence(
  requestId: string,
  uploaded: boolean,
  actorRole: ApiMaintenanceUserRole = 'contractor',
): Promise<ApiMaintenanceState> {
  return api.patch<ApiMaintenanceState>(
    `/maintenance/requests/${requestId}/completion-evidence`,
    { uploaded, actorRole },
  );
}

export async function setInvoiceUploaded(
  requestId: string,
  uploaded: boolean,
  actorRole: ApiMaintenanceUserRole = 'contractor',
): Promise<ApiMaintenanceState> {
  return api.patch<ApiMaintenanceState>(
    `/maintenance/requests/${requestId}/invoice`,
    { uploaded, actorRole },
  );
}

export async function uploadAttachment(body: {
  maintenanceRequestId: string;
  quotationId?: string;
  kind: 'evidence' | 'invoice';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
  actorRole: ApiMaintenanceUserRole;
}): Promise<ApiMaintenanceState> {
  return api.post<ApiMaintenanceState>('/maintenance/attachments/upload', body);
}
