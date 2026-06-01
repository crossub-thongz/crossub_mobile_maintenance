'use client';

import Link from 'next/link';
import { Shield, Upload } from 'lucide-react';

import { ContractorShell } from '@/components/layout/contractor-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { ROUTES } from '@/constants/routes';

export default function ProfilePage() {
  const { profile } = useContractorData();

  return (
    <ContractorShell title="Profile & licence">
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="size-6" />
              </div>
              <div>
                <p className="font-semibold">{profile.companyName}</p>
                <p className="text-muted-foreground text-sm">{profile.tradeCategory}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.VERIFICATION}>View verification status</Link>
            </Button>
          </CardContent>
        </Card>

        <dl className="space-y-3 rounded-xl border bg-card p-4 text-sm">
          <Row label="Contact person" value={profile.contactPerson} />
          <Row label="ABN" value={profile.abn} />
          {profile.acn && <Row label="ACN" value={profile.acn} />}
          <Row label="Mobile" value={profile.mobile} />
          <Row label="Email" value={profile.email} />
          <Row label="Address" value={profile.businessAddress} />
          {profile.licenceNumber && (
            <Row
              label="Licence"
              value={`${profile.licenceNumber}${profile.licenceExpiry ? ` · exp ${profile.licenceExpiry}` : ''}`}
            />
          )}
          <Row
            label="Bank details"
            value={profile.bankDetailsOnFile ? 'On file' : 'Not provided'}
          />
        </dl>

        <section className="space-y-2">
          <p className="text-sm font-semibold">Documents</p>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-dashed p-4 text-left text-sm hover:border-primary/50"
          >
            <Upload className="text-primary size-5" />
            <div>
              <p className="font-medium">Licence certificate</p>
              <p className="text-muted-foreground text-xs">Upload or replace</p>
            </div>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-dashed p-4 text-left text-sm hover:border-primary/50"
          >
            <Upload className="text-primary size-5" />
            <div>
              <p className="font-medium">Insurance documents</p>
              <p className="text-muted-foreground text-xs">Upload or replace</p>
            </div>
          </button>
        </section>
      </div>
    </ContractorShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
