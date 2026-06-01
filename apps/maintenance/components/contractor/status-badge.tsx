import { cn } from '@/lib/utils';

const STATUS_TONES: Record<string, string> = {
  assigned: 'bg-blue-500/15 text-blue-300',
  accepted: 'bg-primary/15 text-primary',
  declined: 'bg-destructive/15 text-destructive',
  awaiting_quotation_approval: 'bg-amber-500/15 text-amber-300',
  approved: 'bg-emerald-500/15 text-emerald-300',
  in_progress: 'bg-sky-500/15 text-sky-300',
  awaiting_tenant_confirmation: 'bg-purple-500/15 text-purple-300',
  invoice_submitted: 'bg-orange-500/15 text-orange-300',
  pending_payment: 'bg-orange-500/15 text-orange-300',
  paid: 'bg-emerald-500/15 text-emerald-300',
  closed: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  assigned: 'New assignment',
  accepted: 'Accepted',
  declined: 'Declined',
  awaiting_quotation_approval: 'Quote pending approval',
  approved: 'Quote approved',
  in_progress: 'In progress',
  awaiting_tenant_confirmation: 'Awaiting tenant confirmation',
  invoice_submitted: 'Invoice submitted',
  pending_payment: 'Pending payment',
  paid: 'Paid',
  closed: 'Closed',
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  const tone = STATUS_TONES[status] ?? 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
        tone,
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === 'critical'
      ? 'text-destructive'
      : priority === 'high'
        ? 'text-amber-400'
        : 'text-muted-foreground';

  return (
    <span className={cn('text-[11px] font-medium uppercase', tone)}>
      {priority}
    </span>
  );
}
