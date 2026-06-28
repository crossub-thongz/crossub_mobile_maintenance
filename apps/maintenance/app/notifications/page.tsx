'use client';

import Link from 'next/link';

import { EmptyState } from '@/components/contractor/connection-banner';
import { ContractorShell } from '@/components/layout/contractor-shell';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { formatRelative } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } =
    useContractorData();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ContractorShell title="Notification history">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            All push notifications stored for audit and review.
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllNotificationsRead()}
              className="text-primary shrink-0 text-xs font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState title="No notifications" />
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={() => {
                if (!n.read) void markNotificationRead(n.id);
              }}
              className={`block rounded-xl border p-4 transition-colors hover:border-primary/40 ${
                n.read ? 'bg-card' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{n.title}</p>
                {!n.read && (
                  <span className="bg-primary size-2 shrink-0 rounded-full" />
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{n.body}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                {formatRelative(n.at)}
                {n.jobTrackingNumber && ` · ${n.jobTrackingNumber}`}
              </p>
            </Link>
          ))
        )}
      </div>
    </ContractorShell>
  );
}
