'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createQuotation,
  fetchMaintenanceKpis,
  fetchMaintenanceState,
  setCompletionEvidence,
  setInvoiceUploaded,
  uploadAttachment,
} from '@/lib/crossub-api/maintenance-client';
import {
  CONTRACTOR_ID,
  mapAllApiJobs,
  notificationsToContractor,
} from '@/lib/data/map-jobs';
import {
  applyLocalJobUpdates,
  useContractorStore,
} from '@/lib/store';
import {
  countByBucket,
  DEMO_JOBS,
  DEMO_MESSAGES,
  DEMO_NOTIFICATIONS,
  DEMO_PROFILE,
} from '@/lib/mock-data';
import type {
  ContractorNotification,
  ContractorProfile,
  DashboardCard,
  MaintenanceJob,
  MessageThread,
} from '@/lib/types';

interface ContractorDataContextValue {
  profile: ContractorProfile;
  jobs: MaintenanceJob[];
  jobsFromApi: MaintenanceJob[];
  messages: MessageThread[];
  notifications: ContractorNotification[];
  dashboardCards: DashboardCard[];
  apiConnected: boolean;
  apiError: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  acceptJob: (id: string) => void;
  declineJob: (id: string, reason: string) => void;
  submitQuotation: (
    jobId: string,
    data: {
      scope: string;
      labourCost: number;
      materialCost: number;
      callOutFee?: number;
      estimatedCompletion: string;
      notes?: string;
    },
  ) => Promise<void>;
  markComplete: (jobId: string) => Promise<void>;
  submitInvoice: (jobId: string) => Promise<void>;
}

const ContractorDataContext = createContext<ContractorDataContextValue | undefined>(
  undefined,
);

export function ContractorDataProvider({ children }: { children: React.ReactNode }) {
  const store = useContractorStore();
  const [jobsFromApi, setJobsFromApi] = useState<MaintenanceJob[]>([]);
  const [apiNotifications, setApiNotifications] = useState<ContractorNotification[]>([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const state = await fetchMaintenanceState();
      const mapped = mapAllApiJobs(state);
      setJobsFromApi(mapped);
      setApiNotifications(
        notificationsToContractor(
          state.maintenanceNotifications,
          state.maintenanceRequests,
        ),
      );
      setApiConnected(true);
      setApiError(null);
      await fetchMaintenanceKpis('contractor').catch(() => undefined);
    } catch {
      setApiConnected(false);
      setApiError('Unable to reach crossub_web API — showing demo data');
      setJobsFromApi([]);
      setApiNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const mergedJobs = useMemo(() => {
    const apiIds = new Set(jobsFromApi.map((j) => j.id));
    const demoOnly = DEMO_JOBS.filter((j) => !apiIds.has(j.id));
    const combined = [...jobsFromApi, ...demoOnly];
    return applyLocalJobUpdates(combined, store);
  }, [jobsFromApi, store]);

  const notifications = useMemo(() => {
    const demoIds = new Set(DEMO_NOTIFICATIONS.map((n) => n.id));
    const apiOnly = apiNotifications.filter((n) => !demoIds.has(n.id));
    return [...apiOnly, ...DEMO_NOTIFICATIONS].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [apiNotifications]);

  const dashboardCards = useMemo(() => countByBucket(mergedJobs), [mergedJobs]);

  const acceptJob = useCallback(
    (id: string) => {
      store.acceptJob(id);
    },
    [store],
  );

  const declineJob = useCallback(
    (id: string, reason: string) => {
      store.declineJob(id, reason);
    },
    [store],
  );

  const submitQuotation = useCallback(
    async (
      jobId: string,
      data: {
        scope: string;
        labourCost: number;
        materialCost: number;
        callOutFee?: number;
        estimatedCompletion: string;
        notes?: string;
      },
    ) => {
      const total =
        data.labourCost + data.materialCost + (data.callOutFee ?? 0);
      const scope = data.notes
        ? `${data.scope}\n\nNotes: ${data.notes}`
        : data.scope;

      if (apiConnected) {
        await createQuotation({
          maintenanceRequestId: jobId,
          contractorId: CONTRACTOR_ID,
          price: total,
          currency: 'AUD',
          scope,
          availableSchedule: data.estimatedCompletion,
          actorRole: 'contractor',
        });
        await refresh();
        return;
      }

      store.updateJob(jobId, {
        status: 'awaiting_quotation_approval',
        bucket: 'awaiting_quotation_approval',
        quotation: {
          id: `q-local-${Date.now()}`,
          jobId,
          labourCost: data.labourCost,
          materialCost: data.materialCost,
          callOutFee: data.callOutFee,
          totalAmount: total,
          scope: data.scope,
          estimatedCompletion: data.estimatedCompletion,
          notes: data.notes,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
        },
      });
    },
    [apiConnected, refresh, store],
  );

  const markComplete = useCallback(
    async (jobId: string) => {
      if (apiConnected) {
        await setCompletionEvidence(jobId, true);
        await refresh();
        return;
      }
      store.updateJob(jobId, {
        completionEvidenceUploaded: true,
        status: 'awaiting_tenant_confirmation',
        bucket: 'awaiting_tenant_confirmation',
      });
    },
    [apiConnected, refresh, store],
  );

  const submitInvoice = useCallback(
    async (jobId: string) => {
      if (apiConnected) {
        await setInvoiceUploaded(jobId, true);
        await refresh();
        return;
      }
      store.updateJob(jobId, {
        invoiceUploaded: true,
        status: 'invoice_submitted',
        bucket: 'pending_payment',
        paymentStatus: 'pending_payment',
      });
    },
    [apiConnected, refresh, store],
  );

  const value: ContractorDataContextValue = {
    profile: DEMO_PROFILE,
    jobs: mergedJobs,
    jobsFromApi,
    messages: DEMO_MESSAGES,
    notifications,
    dashboardCards,
    apiConnected,
    apiError,
    loading,
    refresh,
    acceptJob,
    declineJob,
    submitQuotation,
    markComplete,
    submitInvoice,
  };

  return (
    <ContractorDataContext.Provider value={value}>
      {children}
    </ContractorDataContext.Provider>
  );
}

export function useContractorData(): ContractorDataContextValue {
  const ctx = useContext(ContractorDataContext);
  if (!ctx) {
    throw new Error('useContractorData must be used within ContractorDataProvider');
  }
  return ctx;
}

// Re-export upload for evidence pages
export { uploadAttachment };
