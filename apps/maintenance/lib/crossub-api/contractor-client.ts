import type { components } from '@crossub-thongz/api-contract';

import { crossub } from './client';

export type ContractorJob = components['schemas']['ContractorJobResponseDto'];
export type ContractorJobPhotos = components['schemas']['ContractorJobPhotosDto'];
export type ContractorQuote = components['schemas']['ContractorQuoteResponseDto'];
export type CompleteContractorJob = components['schemas']['CompleteContractorJobDto'];
export type SubmitContractorQuote = components['schemas']['SubmitContractorQuoteDto'];
export type SubmitContractorInvoice =
  components['schemas']['SubmitContractorInvoiceDto'];
export type AddContractorPhotos = components['schemas']['AddContractorPhotosDto'];
export type UploadContractorPhoto =
  components['schemas']['UploadContractorPhotoDto'];
export type ContractorMessageThread =
  components['schemas']['ContractorMessageThreadResponseDto'];
export type CreateContractorMessageThread =
  components['schemas']['CreateContractorMessageThreadDto'];
export type SendContractorMessage =
  components['schemas']['SendContractorMessageDto'];
// Aliased `...Dto` to avoid colliding with the `ContractorNotification` view-model in lib/types.
export type ContractorNotificationDto =
  components['schemas']['ContractorNotificationResponseDto'];
export type ContractorNotificationsReadResult =
  components['schemas']['ContractorNotificationsReadResultDto'];

/** Assigned maintenance jobs for the signed-in contractor (`GET /api/v1/contractor/jobs`). */
export async function fetchJobs(): Promise<ContractorJob[]> {
  const { data, error } = await crossub.GET('/contractor/jobs');
  if (error || !data) throw new Error('Failed to load jobs');
  return data.items;
}

/** One job by id (`GET /api/v1/contractor/jobs/{jobId}`). */
export async function fetchJob(jobId: string): Promise<ContractorJob> {
  const { data, error } = await crossub.GET('/contractor/jobs/{jobId}', {
    params: { path: { jobId } },
  });
  if (error || !data) throw new Error('Failed to load job');
  return data;
}

/** Accept a job (`POST /api/v1/contractor/jobs/{jobId}/accept`). */
export async function acceptJob(jobId: string): Promise<ContractorJob> {
  const { data, error } = await crossub.POST('/contractor/jobs/{jobId}/accept', {
    params: { path: { jobId } },
  });
  if (error || !data) throw new Error('Failed to accept job');
  return data;
}

/** Complete a job (`POST /api/v1/contractor/jobs/{jobId}/complete`). */
export async function completeJob(
  jobId: string,
  body: CompleteContractorJob,
): Promise<ContractorJob> {
  const { data, error } = await crossub.POST('/contractor/jobs/{jobId}/complete', {
    params: { path: { jobId } },
    body,
  });
  if (error || !data) throw new Error('Failed to complete job');
  return data;
}

/** Submit a quote for a job (`POST /api/v1/contractor/jobs/{jobId}/quotes`). */
export async function submitQuote(
  jobId: string,
  body: SubmitContractorQuote,
): Promise<ContractorQuote> {
  const { data, error } = await crossub.POST('/contractor/jobs/{jobId}/quotes', {
    params: { path: { jobId } },
    body,
  });
  if (error || !data) throw new Error('Failed to submit quote');
  return data;
}

/** Invoice a finished job, COMPLETED → INVOICED
 * (`POST /api/v1/contractor/jobs/{jobId}/invoice`). Returns the updated job. */
export async function submitInvoice(
  jobId: string,
  body: SubmitContractorInvoice,
): Promise<ContractorJob> {
  const { data, error } = await crossub.POST('/contractor/jobs/{jobId}/invoice', {
    params: { path: { jobId } },
    body,
  });
  if (error || !data) throw new Error('Failed to submit invoice');
  return data;
}

/** Upload a completion/evidence photo (base64 → R2) for a job
 * (`POST /api/v1/contractor/jobs/{jobId}/photos/upload`). Returns the job's updated photos. */
export async function uploadJobPhoto(
  jobId: string,
  body: UploadContractorPhoto,
): Promise<ContractorJobPhotos> {
  const { data, error } = await crossub.POST(
    '/contractor/jobs/{jobId}/photos/upload',
    { params: { path: { jobId } }, body },
  );
  if (error || !data) throw new Error('Failed to upload photo');
  return data;
}

/** Upload contractor invoice file (PDF/image) (`POST /api/v1/contractor/jobs/{jobId}/invoice/upload`). */
export async function uploadInvoiceFile(
  jobId: string,
  body: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    contentBase64: string;
  },
): Promise<void> {
  const res = await fetch(`/api/contractor/jobs/${jobId}/invoice/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to upload invoice file');
  }
}

/** The signed-in contractor's message threads (`GET /api/v1/contractor/messages`). */
export async function fetchMessages(): Promise<ContractorMessageThread[]> {
  const { data, error } = await crossub.GET('/contractor/messages');
  if (error || !data) throw new Error('Failed to load messages');
  return data;
}

/** Open a new message thread (`POST /api/v1/contractor/messages`). */
export async function createMessageThread(
  body: CreateContractorMessageThread,
): Promise<ContractorMessageThread> {
  const { data, error } = await crossub.POST('/contractor/messages', { body });
  if (error || !data) throw new Error('Failed to create message thread');
  return data;
}

/** Reply to a thread (`POST /api/v1/contractor/messages/{threadId}/reply`). */
export async function replyToThread(
  threadId: string,
  body: SendContractorMessage,
): Promise<ContractorMessageThread> {
  const { data, error } = await crossub.POST(
    '/contractor/messages/{threadId}/reply',
    { params: { path: { threadId } }, body },
  );
  if (error || !data) throw new Error('Failed to send reply');
  return data;
}

/** The signed-in contractor's notifications (`GET /api/v1/contractor/notifications`). */
export async function fetchNotifications(): Promise<ContractorNotificationDto[]> {
  const { data, error } = await crossub.GET('/contractor/notifications');
  if (error || !data) throw new Error('Failed to load notifications');
  return data;
}

/** Mark one notification read (`PATCH /api/v1/contractor/notifications/{id}/read`). */
export async function markNotificationRead(
  notificationId: string,
): Promise<ContractorNotificationDto> {
  const { data, error } = await crossub.PATCH(
    '/contractor/notifications/{notificationId}/read',
    { params: { path: { notificationId } } },
  );
  if (error || !data) throw new Error('Failed to mark notification read');
  return data;
}

/** Mark all notifications read (`POST /api/v1/contractor/notifications/read-all`). */
export async function markAllNotificationsRead(): Promise<ContractorNotificationsReadResult> {
  const { data, error } = await crossub.POST('/contractor/notifications/read-all');
  if (error || !data) throw new Error('Failed to mark all notifications read');
  return data;
}

const CONTRACTOR_API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;

async function contractorRfqPost<T>(
  jobId: string,
  action: 'accept' | 'decline' | 'request-photos',
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${CONTRACTOR_API_BASE}/contractor/jobs/${jobId}/rfq/${action}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`RFQ ${action} failed`);
  return res.json() as Promise<T>;
}

/** Acknowledge RFQ invite — proceed to quote (`POST …/rfq/accept`). */
export async function acceptRfq(jobId: string): Promise<ContractorJob> {
  return contractorRfqPost<ContractorJob>(jobId, 'accept');
}

/** Decline RFQ before quoting (`POST …/rfq/decline`). */
export async function declineRfq(
  jobId: string,
  body: { reason: string },
): Promise<ContractorJob> {
  return contractorRfqPost<ContractorJob>(jobId, 'decline', body);
}

/** Request additional photos before quoting (`POST …/rfq/request-photos`). */
export async function requestRfqPhotos(
  jobId: string,
  body: { message: string },
): Promise<ContractorJob> {
  return contractorRfqPost<ContractorJob>(jobId, 'request-photos', body);
}

/** Submit visit availability for tenant approval (`POST …/schedule/availability`). */
export async function submitScheduleAvailability(
  jobId: string,
  body: { availableTimes: string },
): Promise<ContractorJob> {
  const res = await fetch(
    `${CONTRACTOR_API_BASE}/contractor/jobs/${jobId}/schedule/availability`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error('Schedule availability submit failed');
  return res.json() as Promise<ContractorJob>;
}
