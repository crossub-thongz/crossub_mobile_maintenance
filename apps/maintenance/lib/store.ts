import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { MaintenanceJob } from '@/lib/types';

interface LocalJobActions {
  acceptedJobs: string[];
  declinedJobs: Record<string, string>;
  localUpdates: Record<string, Partial<MaintenanceJob>>;
}

interface ContractorStore extends LocalJobActions {
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason: string) => void;
  updateJob: (id: string, patch: Partial<MaintenanceJob>) => void;
  resetLocal: () => void;
}

const initial: LocalJobActions = {
  acceptedJobs: [],
  declinedJobs: {},
  localUpdates: {},
};

export const useContractorStore = create<ContractorStore>()(
  persist(
    (set) => ({
      ...initial,
      acceptJob: (id) =>
        set((s) => ({
          acceptedJobs: [...new Set([...s.acceptedJobs, id])],
        })),
      declineJob: (id, reason) =>
        set((s) => ({
          declinedJobs: { ...s.declinedJobs, [id]: reason },
        })),
      updateJob: (id, patch) =>
        set((s) => ({
          localUpdates: {
            ...s.localUpdates,
            [id]: { ...s.localUpdates[id], ...patch },
          },
        })),
      resetLocal: () => set(initial),
    }),
    { name: 'crossub-maintenance-store' },
  ),
);

export function applyLocalJobUpdates(
  jobs: MaintenanceJob[],
  store: LocalJobActions,
): MaintenanceJob[] {
  return jobs
    .filter((j) => !store.declinedJobs[j.id])
    .map((j) => {
      const patch = store.localUpdates[j.id] ?? {};
      const accepted = store.acceptedJobs.includes(j.id);
      return {
        ...j,
        ...patch,
        contractorResponse:
          patch.contractorResponse ??
          (accepted ? 'accepted' : j.contractorResponse),
        status:
          accepted && j.status === 'assigned'
            ? ('accepted' as const)
            : (patch.status ?? j.status),
        bucket:
          accepted && j.bucket === 'pending_jobs'
            ? ('approved_jobs' as const)
            : (patch.bucket ?? j.bucket),
      };
    });
}
