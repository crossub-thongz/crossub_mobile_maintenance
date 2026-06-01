'use client';

import { ContractorShell } from '@/components/layout/contractor-shell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <ContractorShell title="Settings" backHref="/profile">
      <div className="space-y-4">
        <section className="rounded-xl border bg-card p-4">
          <p className="text-sm font-semibold">Notifications</p>
          <label className="mt-3 flex items-center justify-between text-sm">
            <span>Push notifications for new jobs</span>
            <input type="checkbox" defaultChecked className="size-4 accent-primary" />
          </label>
          <label className="mt-2 flex items-center justify-between text-sm">
            <span>Quote approval updates</span>
            <input type="checkbox" defaultChecked className="size-4 accent-primary" />
          </label>
          <label className="mt-2 flex items-center justify-between text-sm">
            <span>Payment completed alerts</span>
            <input type="checkbox" defaultChecked className="size-4 accent-primary" />
          </label>
        </section>

        <section className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-semibold">Connected systems</p>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
            <li>crossub_web API — maintenance, auth, notifications</li>
            <li>crossub_mobile_tenant — tenant maintenance requests & confirmation</li>
            <li>crossub_mobile_agent — agent quote approval workflow</li>
          </ul>
        </section>

        <Button variant="destructive" className="w-full" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </ContractorShell>
  );
}
