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
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  markNotificationRead as apiMarkNotificationRead,
  replyToThread as apiReplyToThread,
  uploadJobPhoto as apiUploadJobPhoto,
  fetchJobs,
  fetchMessages,
  fetchNotifications,
} from '@/lib/crossub-api/contractor-client';
import {
  mapContractorJobs,
  mapContractorMessageThreads,
  mapContractorNotifications,
  toMessageThread,
} from '@/lib/crossub-api/contractor-mappers';
import {
  applyLocalJobUpdates,
  useContractorStore,
} from '@/lib/store';
import { fileToBase64 } from '@/lib/utils';
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
  uploadJobPhotos: (jobId: string, files: File[]) => Promise<void>;
  markComplete: (jobId: string) => Promise<void>;
  submitInvoice: (jobId: string) => Promise<void>;
  sendThreadReply: (threadId: string, body: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const ContractorDataContext = createContext<ContractorDataContextValue | undefined>(
  undefined,
);

export function ContractorDataProvider({ children }: { children: React.ReactNode }) {
  const store = useContractorStore();
  const [jobsFromApi, setJobsFromApi] = useState<MaintenanceJob[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>(DEMO_MESSAGES);
  const [notifications, setNotifications] =
    useState<ContractorNotification[]>(DEMO_NOTIFICATIONS);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Read the contractor's assigned jobs from the typed v1 facade
  // (`GET /api/v1/contractor/jobs` — the REAL persisted MaintenanceRequest store, scoped
  // to the signed-in contractor). On any failure we keep the demo seeds so the board
  // never blanks; local optimistic updates (accept/quote/complete) overlay on top.
  const refresh = useCallback(async () => {
    setLoading(true);
    // Jobs, messages and notifications are independent domains — load them per-domain
    // (allSettled) so a failure in one never blanks the others; each falls back to its
    // demo seed.
    const [jobsRes, messagesRes, notificationsRes] = await Promise.allSettled([
      fetchJobs(),
      fetchMessages(),
      fetchNotifications(),
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
    setNotifications(
      notificationsRes.status === 'fulfilled'
        ? mapContractorNotifications(notificationsRes.value)
        : DEMO_NOTIFICATIONS,
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

  // Upload completion/evidence photos for real: each File is read as base64 and pushed
  // through the facade (`POST /contractor/jobs/:id/photos/upload`), which stores it in R2
  // and appends the URL to the job's result photos. Offline (no live API) this is a no-op
  // — the demo board has no server to upload to, matching the old mock-upload behaviour.
  const uploadJobPhotos = useCallback(
    async (jobId: string, files: File[]) => {
      if (!apiConnected || files.length === 0) return;
      for (const file of files) {
        const contentBase64 = await fileToBase64(file);
        await apiUploadJobPhoto(jobId, {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          contentBase64,
        });
      }
    },
    [apiConnected],
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

  // Mark-read flips the local state immediately, then persists to the facade
  // (`PATCH /contractor/notifications/:id/read`); an API error keeps the optimistic flip.
  const markNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      if (apiConnected) {
        try {
          await apiMarkNotificationRead(id);
        } catch {
          // keep the optimistic flip
        }
      }
    },
    [apiConnected],
  );

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (apiConnected) {
      try {
        await apiMarkAllNotificationsRead();
      } catch {
        // keep the optimistic flip
      }
    }
  }, [apiConnected]);

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
    uploadJobPhotos,
    markComplete,
    submitInvoice,
    sendThreadReply,
    markNotificationRead,
    markAllNotificationsRead,
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
