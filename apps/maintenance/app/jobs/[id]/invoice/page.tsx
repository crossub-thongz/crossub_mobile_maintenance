'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

import { ContractorShell } from '@/components/layout/contractor-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { jobDetail } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { jobs, submitInvoice } = useContractorData();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const amount = job.quotation?.totalAmount ?? 0;

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      toast.error('Enter invoice number');
      return;
    }
    if (!invoiceFile) {
      toast.error('Upload the invoice PDF or image');
      return;
    }
    setSubmitting(true);
    try {
      await submitInvoice(job.id, {
        invoiceNumber: invoiceNumber.trim(),
        invoiceAmount: amount,
        invoiceFile,
      });
      toast.success('Invoice submitted — agent will be notified');
      router.push(jobDetail(job.id));
    } catch {
      toast.error('Failed to submit invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContractorShell title="Submit invoice" backHref={jobDetail(job.id)}>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Approved amount</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(amount)}</p>
          <p className="text-muted-foreground mt-2 text-sm">{job.issueSummary}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice number</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-2026-001"
          />
        </div>

        <div className="space-y-2">
          <Label>Invoice file (PDF or image)</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-primary/5">
            <Upload className="text-muted-foreground mb-2 size-7" />
            <span className="text-sm font-medium">Tap to upload invoice</span>
            <span className="text-muted-foreground text-xs">PDF or photo required</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {invoiceFile ? (
            <p className="text-primary text-xs">{invoiceFile.name}</p>
          ) : null}
        </div>

        <dl className="space-y-2 rounded-xl border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Work description</dt>
            <dd className="text-right font-medium">{job.quotation?.scope.slice(0, 40)}...</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-medium">Total</dt>
            <dd className="font-bold text-primary">{formatCurrency(amount)}</dd>
          </div>
        </dl>

        <p className="text-muted-foreground text-xs">
          After both completion photos and this invoice are uploaded, the managing agent
          receives an email and can review the invoice in the agent portal.
        </p>

        <Button
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          Submit invoice
        </Button>
      </div>
    </ContractorShell>
  );
}
