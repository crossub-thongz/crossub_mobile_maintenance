import Link from 'next/link';

import { DataSourceBadge } from '@/components/contractor/connection-banner';
import { PriorityBadge, StatusBadge } from '@/components/contractor/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { jobDetail } from '@/constants/routes';
import type { MaintenanceJob } from '@/lib/types';
import { formatCurrency, formatRelative } from '@/lib/utils';

export function JobCard({ job }: { job: MaintenanceJob }) {
  return (
    <Link href={jobDetail(job.id)}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{job.issueSummary}</p>
              <p className="text-muted-foreground truncate text-xs">
                {job.propertyAddress}
              </p>
            </div>
            <DataSourceBadge source={job.source} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <span className="text-muted-foreground text-[11px]">
              {job.trackingNumber}
            </span>
          </div>
          {job.quotation && (
            <p className="text-sm font-medium text-primary">
              {formatCurrency(job.quotation.totalAmount)}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            {formatRelative(job.submittedAt)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
