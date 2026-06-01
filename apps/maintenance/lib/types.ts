export const TRADE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Locksmith',
  'Cleaning',
  'Gardening',
  'Pest Control',
  'Handyman',
  'Painting',
  'Flooring',
  'Roofing',
  'Appliance Repair',
  'General Maintenance',
  'Other',
] as const;

export type TradeCategory = (typeof TRADE_CATEGORIES)[number];

export const DECLINE_REASONS = [
  'Too Busy',
  'Too Far',
  'Not My Trade',
  'Insufficient Information',
  'Emergency Not Available',
  'Other',
] as const;

export type DeclineReason = (typeof DECLINE_REASONS)[number];

export type VerificationStatus =
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'more_information_required';

export type JobBucket =
  | 'pending_jobs'
  | 'awaiting_quotation_approval'
  | 'approved_jobs'
  | 'in_progress'
  | 'awaiting_tenant_confirmation'
  | 'pending_payment'
  | 'paid_jobs';

export type ContractorJobStatus =
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'awaiting_quotation_approval'
  | 'approved'
  | 'in_progress'
  | 'awaiting_tenant_confirmation'
  | 'invoice_submitted'
  | 'pending_payment'
  | 'paid'
  | 'closed';

export type PaymentStatus =
  | 'invoice_submitted'
  | 'pending_payment'
  | 'payment_approved'
  | 'payment_completed';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface TimelineEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: 'contractor' | 'tenant' | 'agent' | 'crossub' | 'system';
  title: string;
  detail?: string;
  source: 'manual' | 'system' | 'email' | 'app';
}

export interface ContractorProfile {
  id: string;
  companyName: string;
  abn: string;
  acn?: string;
  contactPerson: string;
  mobile: string;
  email: string;
  businessAddress: string;
  tradeCategory: TradeCategory;
  licenceNumber?: string;
  licenceExpiry?: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  missingFields?: string[];
  bankDetailsOnFile: boolean;
}

export interface JobContact {
  name: string;
  email?: string;
  phone?: string;
}

export interface Quotation {
  id: string;
  jobId: string;
  labourCost: number;
  materialCost: number;
  callOutFee?: number;
  totalAmount: number;
  scope: string;
  estimatedCompletion: string;
  notes?: string;
  status: 'submitted' | 'approved' | 'declined' | 'requote_requested';
  declineReason?: string;
  submittedAt: string;
  pdfUrl?: string;
}

export interface MaintenanceJob {
  id: string;
  trackingNumber: string;
  propertyAddress: string;
  issueSummary: string;
  description: string;
  category: string;
  priority: Priority;
  status: ContractorJobStatus;
  bucket: JobBucket;
  submittedAt: string;
  slaDueAt?: string;
  tenant: JobContact;
  agent: JobContact;
  crossubContact: JobContact;
  photos: string[];
  contractorResponse?: 'accepted' | 'declined';
  declineReason?: string;
  quotation?: Quotation;
  appointmentAt?: string;
  accessNotes?: string;
  completionEvidenceUploaded: boolean;
  tenantConfirmed: boolean;
  invoiceUploaded: boolean;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  paidAt?: string;
  timeline: TimelineEntry[];
  source?: 'api' | 'demo';
}

export interface MessageThread {
  id: string;
  jobId?: string;
  jobTrackingNumber?: string;
  propertyAddress: string;
  subject: string;
  participants: string[];
  lastMessage: string;
  lastAt: string;
  unread: number;
  channel: 'app' | 'email' | 'mixed';
  messages: ThreadMessage[];
}

export interface ThreadMessage {
  id: string;
  at: string;
  from: string;
  fromRole: 'contractor' | 'tenant' | 'agent' | 'crossub';
  body: string;
  channel: 'app' | 'email';
}

export interface ContractorNotification {
  id: string;
  type: 'job_assigned' | 'quote_update' | 'payment' | 'reminder' | 'message';
  title: string;
  body: string;
  jobTrackingNumber?: string;
  at: string;
  read: boolean;
  href: string;
}

export interface DashboardCard {
  bucket: JobBucket;
  label: string;
  count: number;
  href: string;
  tone: 'default' | 'warning' | 'action';
}
