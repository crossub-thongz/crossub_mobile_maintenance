'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Camera, CheckCircle2 } from 'lucide-react';

import { ContractorShell } from '@/components/layout/contractor-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { jobDetail } from '@/constants/routes';

export default function CompletePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { jobs, uploadJobPhotos, markComplete } = useContractorData();
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Upload at least one completion photo');
      return;
    }
    setSubmitting(true);
    try {
      await uploadJobPhotos(job.id, files);
      await markComplete(job.id);
      toast.success('Work marked complete — awaiting tenant confirmation');
      router.push(jobDetail(job.id));
    } catch {
      toast.error('Failed to upload evidence or mark complete');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContractorShell title="Completion evidence" backHref={jobDetail(job.id)}>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-medium">{job.issueSummary}</p>
          <p className="text-muted-foreground">{job.propertyAddress}</p>
        </div>

        <div className="space-y-2">
          <Label>Completion photos / videos</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-primary/5">
            <Camera className="text-muted-foreground mb-2 size-8" />
            <span className="text-sm font-medium">Tap to upload evidence</span>
            <span className="text-muted-foreground text-xs">Photos or videos required</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>
          {files.length > 0 && (
            <p className="text-primary text-xs">{files.length} file(s) selected</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parts">Parts / materials used</Label>
          <Input
            id="parts"
            value={parts}
            onChange={(e) => setParts(e.target.value)}
            placeholder="e.g. Inlet valve, washer kit"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Completion notes</Label>
          <textarea
            id="notes"
            className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Work completed, any unresolved issues..."
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs">
          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
          <p>
            After marking complete, the job moves to Awaiting Tenant Confirmation.
            Tenant confirms via the Tenant App before invoice workflow begins.
          </p>
        </div>

        <Button
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          Mark complete
        </Button>
      </div>
    </ContractorShell>
  );
}
