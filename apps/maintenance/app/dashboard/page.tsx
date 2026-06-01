'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { EmptyState } from '@/components/contractor/connection-banner';
import { JobCard } from '@/components/contractor/job-card';
import { ContractorShell } from '@/components/layout/contractor-shell';
import { Card, CardContent } from '@/components/ui/card';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { dashboardCards, jobs, profile, loading } = useContractorData();

  const actionJobs = jobs.filter(
    (j) =>
      j.bucket === 'pending_jobs' ||
      j.bucket === 'approved_jobs' ||
      j.bucket === 'in_progress',
  );

  return (
    <ContractorShell title="Dashboard">
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-muted-foreground text-xs uppercase">Welcome back</p>
          <p className="text-lg font-semibold">{profile.companyName}</p>
          <p className="text-muted-foreground text-sm">
            Receive Job → Accept → Quote → Repair → Complete → Invoice → Get Paid
          </p>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Job overview</h2>
          <div className="grid grid-cols-2 gap-2">
            {dashboardCards.map((card) => (
              <Link key={card.bucket} href={card.href}>
                <Card
                  className={cn(
                    'transition-colors hover:border-primary/40',
                    card.tone === 'action' && card.count > 0 && 'border-primary/50',
                  )}
                >
                  <CardContent className="p-3">
                    <p className="text-2xl font-bold">{loading ? '—' : card.count}</p>
                    <p className="text-muted-foreground text-[11px] leading-tight">
                      {card.label}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Action required</h2>
            <Link
              href={ROUTES.JOBS}
              className="text-primary flex items-center text-xs font-medium"
            >
              All jobs
              <ChevronRight className="size-3" />
            </Link>
          </div>
          {actionJobs.length === 0 ? (
            <EmptyState
              title="No pending actions"
              description="New assignments will appear here with push notifications."
            />
          ) : (
            <div className="space-y-3">
              {actionJobs.slice(0, 5).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </ContractorShell>
  );
}
