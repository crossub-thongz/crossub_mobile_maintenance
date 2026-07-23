'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar, Camera, FileText, Phone, Upload } from 'lucide-react';

import { DataSourceBadge } from '@/components/contractor/connection-banner';
import { PriorityBadge, StatusBadge } from '@/components/contractor/status-badge';
import { Timeline } from '@/components/contractor/timeline';
import { ContractorShell } from '@/components/layout/contractor-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { DECLINE_REASONS } from '@/lib/types';
import {
  jobComplete,
  jobInvoice,
  jobQuote,
  messageDetail,
  ROUTES,
} from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { jobs, acceptRfq, declineJob, requestMorePhotos, submitScheduleAvailability } =
    useContractorData();
  const [showDecline, setShowDecline] = useState(false);
  const [showPhotoRequest, setShowPhotoRequest] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [photoRequestMessage, setPhotoRequestMessage] = useState('');
  const [scheduleTimes, setScheduleTimes] = useState('');
  const [rfqBusy, setRfqBusy] = useState(false);

  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const handleAcceptRfq = async () => {
    setRfqBusy(true);
    try {
      await acceptRfq(job.id);
      toast.success('RFQ accepted — you can submit your quotation');
    } catch {
      toast.error('Could not accept — try again');
    } finally {
      setRfqBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason) {
      toast.error('Select a decline reason');
      return;
    }
    setRfqBusy(true);
    try {
      await declineJob(job.id, declineReason);
      toast.success('RFQ declined — agent has been notified');
      setShowDecline(false);
    } catch {
      toast.error('Could not decline — try again');
    } finally {
      setRfqBusy(false);
    }
  };

  const handleRequestPhotos = async () => {
    if (!photoRequestMessage.trim()) {
      toast.error('Describe what photos or details you need');
      return;
    }
    setRfqBusy(true);
    try {
      await requestMorePhotos(job.id, photoRequestMessage.trim());
      toast.success('Photo request sent to agent');
      setShowPhotoRequest(false);
      setPhotoRequestMessage('');
    } catch {
      toast.error('Could not send request — try again');
    } finally {
      setRfqBusy(false);
    }
  };

  const rfqAccepted =
    job.contractorResponse === 'accepted' ||
    job.status === 'accepted' ||
    Boolean(job.quotation);

  return (
    <ContractorShell title={job.trackingNumber} backHref={ROUTES.JOBS}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{job.issueSummary}</h2>
            <p className="text-muted-foreground text-sm">{job.propertyAddress}</p>
          </div>
          <DataSourceBadge source={job.source} />
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={job.status} />
          <PriorityBadge priority={job.priority} />
        </div>

        <Card>
          <CardContent className="space-y-3 p-4 text-sm">
            <p>{job.description}</p>
            <p className="text-muted-foreground text-xs">
              Submitted {formatDateTime(job.submittedAt)}
              {job.slaDueAt && ` · Respond by ${formatDateTime(job.slaDueAt)}`}
            </p>
          </CardContent>
        </Card>

        <section className="grid grid-cols-2 gap-2 text-sm">
          <ContactCard label="Tenant" contact={job.tenant} />
          <ContactCard label="Agent" contact={job.agent} />
        </section>

        {job.status === 'assigned' && job.status !== 'declined' && (
          <div className="space-y-2">
            {!rfqAccepted ? (
              <>
                <p className="text-muted-foreground text-xs">
                  Review the job details, then accept to quote, decline, or request more photos.
                </p>
                {!showDecline && !showPhotoRequest ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button size="lg" disabled={rfqBusy} onClick={() => void handleAcceptRfq()}>
                      Accept &amp; quote
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={rfqBusy}
                      onClick={() => setShowPhotoRequest(true)}
                    >
                      <Camera className="size-4" />
                      Request photos
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={rfqBusy}
                      onClick={() => setShowDecline(true)}
                    >
                      Decline
                    </Button>
                  </div>
                ) : null}
                {showPhotoRequest ? (
                  <div className="space-y-2 rounded-xl border bg-card p-4">
                    <p className="text-sm font-medium">Request more pictures</p>
                    <textarea
                      className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Describe what photos or details you need before quoting…"
                      value={photoRequestMessage}
                      onChange={(e) => setPhotoRequestMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button disabled={rfqBusy} onClick={() => void handleRequestPhotos()}>
                        Send request
                      </Button>
                      <Button variant="ghost" onClick={() => setShowPhotoRequest(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
            {showDecline ? (
              <div className="space-y-2 rounded-xl border bg-card p-4">
                <p className="text-sm font-medium">Decline reason</p>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                >
                  <option value="">Select reason...</option>
                  {DECLINE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="destructive" disabled={rfqBusy} onClick={() => void handleDecline()}>
                    Confirm decline
                  </Button>
                  <Button variant="ghost" onClick={() => setShowDecline(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {rfqAccepted &&
          !job.quotation &&
          job.status !== 'declined' && (
          <Button asChild className="w-full" size="lg">
            <Link href={jobQuote(job.id)}>
              <FileText className="size-4" />
              Submit quotation
            </Link>
          </Button>
        )}

        {job.quotation && (
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-semibold">Quotation</p>
              <p className="text-primary text-xl font-bold">
                {formatCurrency(job.quotation.totalAmount)}
              </p>
              <p className="text-muted-foreground text-xs">{job.quotation.scope}</p>
              <StatusBadge status={job.quotation.status} />
            </CardContent>
          </Card>
        )}

        {job.quotation && job.status !== 'declined' && job.status !== 'closed' && (
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Schedule visit</p>
            <p className="text-muted-foreground text-xs">
              After your quote is approved, contact the tenant and submit your available visit
              times for them to confirm.
            </p>
            <textarea
              className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. Mon 10 Mar 9–11am, Tue 11 Mar 2–4pm"
              value={scheduleTimes}
              onChange={(e) => setScheduleTimes(e.target.value)}
              rows={3}
            />
            <Button
              className="w-full"
              disabled={rfqBusy || !scheduleTimes.trim()}
              onClick={async () => {
                setRfqBusy(true);
                try {
                  await submitScheduleAvailability(job.id, scheduleTimes);
                  toast.success('Visit times sent to tenant for approval');
                  setScheduleTimes('');
                } catch {
                  toast.error('Could not submit — ensure your quote is approved first');
                } finally {
                  setRfqBusy(false);
                }
              }}
            >
              Submit availability
            </Button>
          </div>
        )}

        {(job.status === 'approved' || job.status === 'in_progress') && (
          <div className="space-y-2">
            {job.appointmentAt && (
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm">
                <Calendar className="size-4 text-primary" />
                Appointment: {formatDateTime(job.appointmentAt)}
              </div>
            )}
            <Button asChild className="w-full" variant="secondary">
              <Link href={messageDetail(`msg-${job.id.slice(-3)}`)}>
                Contact tenant
              </Link>
            </Button>
            {!job.completionEvidenceUploaded && (
              <Button asChild className="w-full" size="lg">
                <Link href={jobComplete(job.id)}>
                  <Upload className="size-4" />
                  Upload completion evidence
                </Link>
              </Button>
            )}
          </div>
        )}

        {job.completionEvidenceUploaded &&
          job.tenantConfirmed &&
          !job.invoiceUploaded && (
            <Button asChild className="w-full" size="lg">
              <Link href={jobInvoice(job.id)}>Submit invoice</Link>
            </Button>
          )}

        {job.paymentStatus && (
          <Card>
            <CardContent className="p-4 text-sm">
              <p className="font-medium">Payment status</p>
              <p className="text-muted-foreground capitalize">
                {job.paymentStatus.replace(/_/g, ' ')}
              </p>
              {job.paymentReference && (
                <p className="text-primary mt-1">{job.paymentReference}</p>
              )}
            </CardContent>
          </Card>
        )}

        <section>
          <h3 className="mb-3 text-sm font-semibold">Job timeline</h3>
          <Timeline entries={job.timeline} />
        </section>
      </div>
    </ContractorShell>
  );
}

function ContactCard({
  label,
  contact,
}: {
  label: string;
  contact: { name: string; email?: string; phone?: string };
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{contact.name}</p>
      {contact.phone && (
        <a href={`tel:${contact.phone}`} className="text-primary mt-1 flex items-center gap-1 text-xs">
          <Phone className="size-3" />
          {contact.phone}
        </a>
      )}
    </div>
  );
}
