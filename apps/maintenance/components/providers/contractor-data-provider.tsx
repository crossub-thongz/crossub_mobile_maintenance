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
  acceptJob as apiAcceptJob,
  completeJob as apiCompleteJob,
  replyToThread as apiReplyToThread,
  fetchJobs,
  fetchMessages,
} from '@/lib/crossub-api/contractor-client';
import {
  mapContractorJobs,
  mapContractorMessageThreads,
  toMessageThread,
} from '@/lib/crossub-api/contractor-mappers';
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
  sendThreadReply: (threadId: string, body: string) => Promise<void>;
}

const ContractorDataContext = createContext<ContractorDataContextValue | undefined>(
  undefined,
);

export function ContractorDataProvider({ children }: { children: React.ReactNode }) {
  const store = useContractorStore();
  const [jobsFromApi, setJobsFromApi] = useState<MaintenanceJob[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>(DEMO_MESSAGES);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Read the contractor's assigned jobs from the typed v1 facade
  // (`GET /api/v1/contractor/jobs` — the REAL persisted MaintenanceRequest store, scoped
  // to the signed-in contractor). On any failure we keep the demo seeds so the board
  // never blanks; local optimistic updates (accept/quote/complete) overlay on top.
  const refresh = useCallback(async () => {
    setLoading(true);
    // Jobs and messages are independent domains — load them per-domain (allSettled) so a
    // failure in one never blanks the other; each falls back to its demo seed.
    const [jobsRes, messagesRes] = await Promise.allSettled([
      fetchJobs(),
      fetchMessages(),
    ]);
    if (jobsRes.status === 'fulfilled') {
      setJobsFromApi(mapContractorJobs(jobsRes.value));
      setApiConnected(true);
      setApiError(null);
    } else {
      setApiConnected(false);
      setApiError('Unable to reach CROSSUB API — showing demo data');
      setJobsFromApi([]);
    }
    setMessages(
      messagesRes.status === 'fulfilled'
        ? mapContractorMessageThreads(messagesRes.value)
        : DEMO_MESSAGES,
    );
    setLoading(false);
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

  // The contractor facade exposes no notifications endpoint yet (a documented gap), so
  // notifications stay on demo data until that facade lands.
  const notifications = useMemo(
    () =>
      [...DEMO_NOTIFICATIONS].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      ),
    [],
  );

  const dashboardCards = useMemo(() => countByBucket(mergedJobs), [mergedJobs]);

  // Accept persists APPROVED -> SCHEDULED on the real facade. We flip the local overlay
  // first for instant feedback, then reconcile from the server; an API error just leaves
  // the optimistic state in place (graceful — same as the offline path).
  const acceptJob = useCallback(
    (id: string) => {
      store.acceptJob(id);
      if (apiConnected) {
        void apiAcceptJob(id)
          .then(() => refresh())
          .catch(() => undefined);
      }
    },
    [apiConnected, refresh, store],
  );

  const declineJob = useCallback(
    (id: string, reason: string) => {
      store.declineJob(id, reason);
    },
    [store],
  );

  // Quote submission has no clean facade analog yet — the real `POST /quotes` takes a
  // subtotal/gst/total breakdown (not labour/material/call-out) and does not move the
  // job's status — so the contractor's quote stays an optimistic local update for now.
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
    [store],
  );

  // Complete persists SCHEDULED -> COMPLETED on the real facade, then re-reads. If the
  // server rejects the move (e.g. the job is not SCHEDULED) we fall back to the optimistic
  // local update so the flow still advances.
  const markComplete = useCallback(
    async (jobId: string) => {
      if (apiConnected) {
        try {
          await apiCompleteJob(jobId, {});
          await refresh();
          return;
        } catch {
          // fall through to the optimistic local update
        }
      }
      store.updateJob(jobId, {
        completionEvidenceUploaded: true,
        status: 'awaiting_tenant_confirmation',
        bucket: 'awaiting_tenant_confirmation',
      });
    },
    [apiConnected, refresh, store],
  );

  // Invoice submission is staff/accounting-side — the contractor facade has no endpoint
  // for it — so it stays an optimistic local update until that facade lands.
  const submitInvoice = useCallback(
    async (jobId: string) => {
      store.updateJob(jobId, {
        invoiceUploaded: true,
        status: 'invoice_submitted',
        bucket: 'pending_payment',
        paymentStatus: 'pending_payment',
      });
    },
    [store],
  );

  // Reply persists to the real facade (`POST /contractor/messages/:id/reply`); we replace
  // the thread in state with the server's authoritative copy. Offline (or on error) we
  // append an optimistic local message so the conversation still advances.
  const sendThreadReply = useCallback(
    async (threadId: string, body: string) => {
      const text = body.trim();
      if (!text) return;
      if (apiConnected) {
        try {
          const updated = await apiReplyToThread(threadId, { body: text });
          const mapped = toMessageThread(updated);
          setMessages((prev) =>
            prev.map((t) => (t.id === threadId ? mapped : t)),
          );
          return;
        } catch {
          // fall through to the optimistic local append
        }
      }
      const now = new Date().toISOString();
      setMessages((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                lastMessage: text,
                lastAt: now,
                messages: [
                  ...t.messages,
                  {
                    id: `local-${now}`,
                    at: now,
                    from: 'You',
                    fromRole: 'contractor',
                    body: text,
                    channel: 'app',
                  },
                ],
              }
            : t,
        ),
      );
    },
    [apiConnected],
  );

  const value: ContractorDataContextValue = {
    profile: DEMO_PROFILE,
    jobs: mergedJobs,
    jobsFromApi,
    messages,
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
    sendThreadReply,
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
