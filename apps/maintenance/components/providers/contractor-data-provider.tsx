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
  acceptRfq as apiAcceptRfq,
  declineRfq as apiDeclineRfq,
  requestRfqPhotos as apiRequestRfqPhotos,
  submitScheduleAvailability as apiSubmitScheduleAvailability,
  completeJob as apiCompleteJob,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  markNotificationRead as apiMarkNotificationRead,
  replyToThread as apiReplyToThread,
  submitInvoice as apiSubmitInvoice,
  uploadInvoiceFile as apiUploadInvoiceFile,
  submitQuote as apiSubmitQuote,
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
  acceptRfq: (id: string) => Promise<void>;
  declineJob: (id: string, reason: string) => Promise<void>;
  requestMorePhotos: (id: string, message: string) => Promise<void>;
  submitScheduleAvailability: (id: string, availableTimes: string) => Promise<void>;
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
  submitInvoice: (
    jobId: string,
    data: { invoiceNumber: string; invoiceAmount?: number; invoiceFile?: File },
  ) => Promise<void>;
  sendThreadReply: (threadId: string, body: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const ContractorDataContext = createContext<ContractorDataContextValue | undefined>(
  undefined,
);

const EMPTY_PROFILE: ContractorProfile = {
  id: '',
  companyName: '',
  abn: '',
  contactPerson: '',
  mobile: '',
  email: '',
  businessAddress: '',
  tradeCategory: '',
  licenceNumber: '',
  licenceExpiry: '',
  verificationStatus: 'pending',
  bankDetailsOnFile: false,
};

export function ContractorDataProvider({ children }: { children: React.ReactNode }) {
  const store = useContractorStore();
  const [jobsFromApi, setJobsFromApi] = useState<MaintenanceJob[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [notifications, setNotifications] = useState<ContractorNotification[]>([]);
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
      setApiError('Unable to reach CROSSUB API');
      setJobsFromApi([]);
    }
    setMessages(
      messagesRes.status === 'fulfilled'
        ? mapContractorMessageThreads(messagesRes.value)
        : [],
    );
    setNotifications(
      notificationsRes.status === 'fulfilled'
        ? mapContractorNotifications(notificationsRes.value)
        : [],
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // When live, the board shows ONLY the contractor's real API jobs — no demo seeds
  // blended in. The demo seeds are used solely as an offline fallback (when the API is
  // unreachable) so the board never blanks; the apiError banner makes that state explicit
  // (mirrors how messages/notifications replace, not merge, their live data).
  const mergedJobs = useMemo(() => {
    return applyLocalJobUpdates(jobsFromApi, store);
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

  const acceptRfq = useCallback(
    async (id: string) => {
      store.updateJob(id, { contractorResponse: 'accepted' });
      if (apiConnected) {
        try {
          await apiAcceptRfq(id);
          await refresh();
        } catch {
          // keep optimistic state
        }
      }
    },
    [apiConnected, refresh, store],
  );

  const declineJob = useCallback(
    async (id: string, reason: string) => {
      store.declineJob(id, reason);
      if (apiConnected) {
        try {
          await apiDeclineRfq(id, { reason });
          await refresh();
        } catch {
          // keep local decline overlay
        }
      }
    },
    [apiConnected, refresh, store],
  );

  const requestMorePhotos = useCallback(
    async (id: string, message: string) => {
      if (!message.trim()) return;
      if (apiConnected) {
        try {
          await apiRequestRfqPhotos(id, { message: message.trim() });
          await refresh();
        } catch {
          // no-op
        }
      }
    },
    [apiConnected, refresh],
  );

  const submitScheduleAvailability = useCallback(
    async (id: string, availableTimes: string) => {
      if (!availableTimes.trim()) return;
      if (apiConnected) {
        await apiSubmitScheduleAvailability(id, { availableTimes: availableTimes.trim() });
        await refresh();
      }
    },
    [apiConnected, refresh],
  );

  // Quote submission persists a real MaintenanceQuote via the facade
  // (`POST /contractor/jobs/:id/quotes`) — the breakdown (labour/material/call-out +
  // estimated completion) now has dedicated columns, so the contractor's quote is no
  // longer just a local note. We re-read after (the job card carries its latest quote, so
  // the board derives "awaiting quotation approval" off the persisted row — no status
  // transition). Offline (or on error) we fall back to the optimistic local update.
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
      const callOut = data.callOutFee ?? 0;
      const total = data.labourCost + data.materialCost + callOut;
      if (apiConnected) {
        try {
          await apiSubmitQuote(jobId, {
            subtotal: total,
            total,
            labourCost: data.labourCost,
            materialCost: data.materialCost,
            callOutFee: callOut,
            estimatedCompletion: data.estimatedCompletion,
            descriptions: data.scope,
            terms: data.notes,
          });
          await refresh();
          return;
        } catch {
          // fall through to the optimistic local update
        }
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

  // Invoice persists COMPLETED -> INVOICED on the real facade
  // (`POST /contractor/jobs/:id/invoice`), stamping the invoice number/amount/date on the
  // job, then re-reads (the board derives "pending payment" off the INVOICED status). If
  // the server rejects the move (e.g. the job isn't COMPLETED) we fall back to the
  // optimistic local update so the flow still advances.
  const submitInvoice = useCallback(
    async (
      jobId: string,
      data: { invoiceNumber: string; invoiceAmount?: number; invoiceFile?: File },
    ) => {
      if (apiConnected) {
        try {
          await apiSubmitInvoice(jobId, {
            invoiceNumber: data.invoiceNumber,
            invoiceAmount: data.invoiceAmount,
          });
          if (data.invoiceFile) {
            const mime = data.invoiceFile.type || 'application/pdf';
            const contentBase64 = await fileToBase64(data.invoiceFile);
            await apiUploadInvoiceFile(jobId, {
              fileName: data.invoiceFile.name,
              mimeType: mime,
              sizeBytes: data.invoiceFile.size,
              contentBase64,
            });
          }
          await refresh();
          return;
        } catch {
          // fall through to the optimistic local update
        }
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
    profile: EMPTY_PROFILE,
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
    acceptRfq,
    declineJob,
    requestMorePhotos,
    submitScheduleAvailability,
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
