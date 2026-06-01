'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { EmptyState } from '@/components/contractor/connection-banner';
import { JobCard } from '@/components/contractor/job-card';
import { ContractorShell } from '@/components/layout/contractor-shell';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { DASHBOARD_BUCKETS } from '@/lib/mock-data';
import type { JobBucket } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function JobsPage() {
  const searchParams = useSearchParams();
  const bucket = searchParams.get('bucket') as JobBucket | null;
  const { jobs } = useContractorData();

  const filtered = useMemo(() => {
    if (!bucket) return jobs;
    return jobs.filter((j) => j.bucket === bucket);
  }, [jobs, bucket]);

  const activeLabel =
    DASHBOARD_BUCKETS.find((b) => b.bucket === bucket)?.label ?? 'All jobs';

  return (
    <ContractorShell title={activeLabel}>
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip href="/jobs" active={!bucket} label="All" count={jobs.length} />
          {DASHBOARD_BUCKETS.map((b) => (
            <FilterChip
              key={b.bucket}
              href={b.href}
              active={bucket === b.bucket}
              label={b.label.replace('Awaiting ', '').replace(' Jobs', '')}
              count={jobs.filter((j) => j.bucket === b.bucket).length}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No jobs in this category"
            description="Assigned work orders from CROSSUB will appear here."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </ContractorShell>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <a
      href={href}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-secondary',
      )}
    >
      {label} ({count})
    </a>
  );
}
