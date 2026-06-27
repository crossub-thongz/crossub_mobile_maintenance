import type { components } from '@crossub-thongz/api-contract';

import { crossub } from './client';

export type ContractorJob = components['schemas']['ContractorJobResponseDto'];
export type ContractorJobPhotos = components['schemas']['ContractorJobPhotosDto'];
export type ContractorQuote = components['schemas']['ContractorQuoteResponseDto'];
export type CompleteContractorJob = components['schemas']['CompleteContractorJobDto'];
export type SubmitContractorQuote = components['schemas']['SubmitContractorQuoteDto'];
export type AddContractorPhotos = components['schemas']['AddContractorPhotosDto'];

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
