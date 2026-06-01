'use client';

import Link from 'next/link';

import { EmptyState } from '@/components/contractor/connection-banner';
import { ContractorShell } from '@/components/layout/contractor-shell';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { messageDetail } from '@/constants/routes';
import { formatRelative } from '@/lib/utils';

export default function MessagesPage() {
  const { messages } = useContractorData();

  return (
    <ContractorShell title="Communication Hub">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">
          Messages with tenants, CROSSUB maintenance team, and agents — linked to
          job timeline.
        </p>

        {messages.length === 0 ? (
          <EmptyState title="No messages yet" />
        ) : (
          messages.map((thread) => (
            <Link
              key={thread.id}
              href={messageDetail(thread.id)}
              className="block rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{thread.subject}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {thread.propertyAddress}
                  </p>
                </div>
                {thread.unread > 0 && (
                  <span className="bg-destructive flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] text-white">
                    {thread.unread}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-2 truncate text-sm">
                {thread.lastMessage}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatRelative(thread.lastAt)} · {thread.channel}
              </p>
            </Link>
          ))
        )}
      </div>
    </ContractorShell>
  );
}
