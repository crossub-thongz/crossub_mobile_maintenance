'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const [submitting, setSubmitting] = useState(false);

  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const amount = job.quotation?.totalAmount ?? 0;

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      toast.error('Enter invoice number');
      return;
    }
    setSubmitting(true);
    try {
      await submitInvoice(job.id);
      toast.success('Invoice submitted to Agent / Accounting');
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

        <dl className="space-y-2 rounded-xl border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Work description</dt>
            <dd className="text-right font-medium">{job.quotation?.scope.slice(0, 40)}...</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">GST</dt>
            <dd className="font-medium">Included</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-medium">Total</dt>
            <dd className="font-bold text-primary">{formatCurrency(amount)}</dd>
          </div>
        </dl>

        <p className="text-muted-foreground text-xs">
          Invoice PDF is generated automatically for audit. Payment tracking updates
          when Accounting processes the payment.
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
