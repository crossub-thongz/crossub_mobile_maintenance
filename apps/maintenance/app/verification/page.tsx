'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

import { ContractorShell } from '@/components/layout/contractor-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useContractorData } from '@/components/providers/contractor-data-provider';
import { ROUTES } from '@/constants/routes';

const STATUS_CONFIG = {
  pending_verification: {
    icon: Clock,
    title: 'Pending verification',
    description:
      'Your profile has been submitted and is awaiting CROSSUB review. Job acceptance is blocked until approved.',
    tone: 'text-amber-400',
  },
  approved: {
    icon: ShieldCheck,
    title: 'Approved',
    description: 'Your supplier profile is verified. You can receive and accept jobs.',
    tone: 'text-primary',
  },
  rejected: {
    icon: Clock,
    title: 'Rejected',
    description: 'Verification was not approved. Contact CROSSUB or resubmit documents.',
    tone: 'text-destructive',
  },
  more_information_required: {
    icon: Clock,
    title: 'More information required',
    description: 'Please upload missing licence or insurance documents on your profile.',
    tone: 'text-amber-400',
  },
} as const;

export default function VerificationPage() {
  const { profile } = useContractorData();
  const config = STATUS_CONFIG[profile.verificationStatus];
  const Icon = config.icon;

  return (
    <ContractorShell title="Verification status" backHref={ROUTES.PROFILE}>
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <Icon className={`mx-auto size-12 ${config.tone}`} />
            <div>
              <h2 className="text-lg font-semibold">{config.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{config.description}</p>
            </div>
          </CardContent>
        </Card>

        <dl className="space-y-3 rounded-xl border bg-card p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Company</dt>
            <dd className="font-medium">{profile.companyName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ABN</dt>
            <dd className="font-medium">{profile.abn}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Trade</dt>
            <dd className="font-medium">{profile.tradeCategory}</dd>
          </div>
          {profile.licenceNumber && (
            <div>
              <dt className="text-muted-foreground">Licence</dt>
              <dd className="font-medium">
                {profile.licenceNumber}
                {profile.licenceExpiry && ` · expires ${profile.licenceExpiry}`}
              </dd>
            </div>
          )}
        </dl>

        {profile.verificationStatus === 'approved' && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
            <CheckCircle2 className="size-4" />
            Full app access enabled
          </div>
        )}

        <Button asChild className="w-full">
          <Link href={ROUTES.PROFILE}>Manage profile & documents</Link>
        </Button>
      </div>
    </ContractorShell>
  );
}
