'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ContractorShell } from '@/components/layout/contractor-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { jobDetail } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  scope: z.string().min(10, 'Describe the scope of works'),
  labourCost: z.coerce.number().min(0),
  materialCost: z.coerce.number().min(0),
  callOutFee: z.coerce.number().min(0).optional(),
  estimatedCompletion: z.string().min(1, 'Select completion date'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function QuotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { jobs, submitQuotation } = useContractorData();
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      labourCost: 0,
      materialCost: 0,
      callOutFee: 0,
    },
  });

  const labour = watch('labourCost') || 0;
  const material = watch('materialCost') || 0;
  const callOut = watch('callOutFee') || 0;
  const total = Number(labour) + Number(material) + Number(callOut);

  const onSubmit = async (values: FormValues) => {
    try {
      await submitQuotation(job.id, values);
      toast.success('Quotation submitted — PDF generated for audit');
      router.push(jobDetail(job.id));
    } catch {
      toast.error('Failed to submit quotation');
    }
  };

  return (
    <ContractorShell title="Submit quotation" backHref={jobDetail(job.id)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="font-medium">{job.issueSummary}</p>
          <p className="text-muted-foreground text-sm">{job.propertyAddress}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scope">Description of works</Label>
          <textarea
            id="scope"
            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Scope of repair work..."
            {...register('scope')}
          />
          {errors.scope && (
            <p className="text-xs text-destructive">{errors.scope.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="labourCost">Labour cost ($)</Label>
            <Input id="labourCost" type="number" step="0.01" {...register('labourCost')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="materialCost">Material cost ($)</Label>
            <Input id="materialCost" type="number" step="0.01" {...register('materialCost')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="callOutFee">Call-out fee ($) — if site inspection required</Label>
          <Input id="callOutFee" type="number" step="0.01" {...register('callOutFee')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedCompletion">Estimated completion date</Label>
          <Input id="estimatedCompletion" type="date" {...register('estimatedCompletion')} />
          {errors.estimatedCompletion && (
            <p className="text-xs text-destructive">
              {errors.estimatedCompletion.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" placeholder="Optional notes for agent..." {...register('notes')} />
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-muted-foreground text-xs uppercase">Total amount</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Sent to Agent for approval via crossub_web
          </p>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          Submit quotation
        </Button>
      </form>
    </ContractorShell>
  );
}
