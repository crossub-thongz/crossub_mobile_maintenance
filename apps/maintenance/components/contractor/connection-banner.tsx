'use client';

import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

import { useContractorData } from '@/components/providers/contractor-data-provider';
import { cn } from '@/lib/utils';

export function ConnectionBanner() {
  const { apiConnected, apiError } = useContractorData();

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
        apiConnected
          ? 'border-primary/30 bg-primary/5 text-primary'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-200',
      )}
    >
      {apiConnected ? (
        <Wifi className="mt-0.5 size-3.5 shrink-0" />
      ) : (
        <WifiOff className="mt-0.5 size-3.5 shrink-0" />
      )}
      <div>
        <p className="font-medium">
          {apiConnected ? 'Connected to crossub_web' : 'Demo mode'}
        </p>
        {!apiConnected && apiError && (
          <p className="mt-0.5 opacity-80">{apiError}</p>
        )}
        {apiConnected && (
          <p className="mt-0.5 opacity-80">
            Jobs sync with tenant app and agent portal via shared API
          </p>
        )}
      </div>
    </div>
  );
}

export function DataSourceBadge({ source }: { source?: 'api' | 'demo' }) {
  if (!source) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase',
        source === 'api'
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {source === 'api' ? 'Live' : 'Demo'}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <AlertCircle className="text-muted-foreground mb-3 size-8" />
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      )}
    </div>
  );
}
