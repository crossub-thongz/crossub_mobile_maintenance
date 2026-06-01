import type { TimelineEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No timeline events yet.</p>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <ol className="space-y-3">
      {sorted.map((entry) => (
        <li key={entry.id} className="relative border-l-2 border-border pl-4">
          <div className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary" />
          <p className="text-sm font-medium">{entry.title}</p>
          <p className="text-muted-foreground text-xs">
            {entry.actor} · {formatDateTime(entry.at)}
          </p>
          {entry.detail && (
            <p className="text-muted-foreground mt-1 text-xs">{entry.detail}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
