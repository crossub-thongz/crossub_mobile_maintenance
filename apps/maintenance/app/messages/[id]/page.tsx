'use client';

import { notFound, useParams } from 'next/navigation';

import { ContractorShell } from '@/components/layout/contractor-shell';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

export default function MessageDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { messages } = useContractorData();

  const thread =
    messages.find((m) => m.id === id) ??
    messages.find((m) => m.jobId && id.includes(m.jobId.slice(-3)));

  if (!thread) notFound();

  return (
    <ContractorShell title={thread.subject} backHref={ROUTES.MESSAGES}>
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-3 text-sm">
          <p className="text-muted-foreground text-xs">{thread.propertyAddress}</p>
          {thread.jobTrackingNumber && (
            <p className="text-primary text-xs">{thread.jobTrackingNumber}</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">
            Participants: {thread.participants.join(', ')}
          </p>
        </div>

        <div className="space-y-3">
          {thread.messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.fromRole === 'contractor'
                  ? 'ml-8 rounded-xl bg-primary/10 p-3'
                  : 'mr-8 rounded-xl bg-secondary p-3'
              }
            >
              <p className="text-xs font-medium">{msg.from}</p>
              <p className="mt-1 text-sm">{msg.body}</p>
              <p className="text-muted-foreground mt-1 text-[10px]">
                {formatDateTime(msg.at)} · {msg.channel}
              </p>
            </div>
          ))}
        </div>

        <form className="fixed bottom-20 left-1/2 w-full max-w-lg -translate-x-1/2 px-4">
          <div className="flex gap-2 rounded-xl border bg-card p-2 shadow-lg">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-2 text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={(e) => e.preventDefault()}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </ContractorShell>
  );
}
