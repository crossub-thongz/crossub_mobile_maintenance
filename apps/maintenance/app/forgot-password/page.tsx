'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wrench className="size-5" />
        </div>
        <p className="text-lg font-semibold">Reset password</p>
      </div>

      <div className="w-full max-w-md rounded-xl border bg-card p-8">
        <p className="text-muted-foreground mb-6 text-sm">
          Enter your email and we will send a reset link via crossub_web (same auth
          as tenant and agent apps).
        </p>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com.au" />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
        <Link
          href={ROUTES.LOGIN}
          className="text-primary mt-4 block text-center text-sm hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
