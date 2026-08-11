'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Mail, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { ApiError, api } from '@/lib/api';

/**
 * Self-service way back in.
 *
 * This page used to render a complete, convincing form — email field, "Send reset link"
 * button — wired to `onSubmit={(e) => e.preventDefault()}`. It sent nothing, showed nothing,
 * and reported nothing. That is a worse failure than the tenant app's dead-end paragraph it
 * shipped alongside: there the reader at least got a sentence to argue with, and five of them
 * screenshotted it. Here the button simply does not respond, which reads as a slow network
 * rather than a broken screen, so a contractor would tap it repeatedly and never report it.
 *
 * `POST /api/auth/forgot-password` is public and already correct, including for an account
 * that has never been used: `AuthService.forgotPassword` re-sends a fresh SETUP link to a
 * PENDING_INVITE user rather than staying silent. That matters here because a contractor's
 * login is provisioned for them — they never chose a password, so "forgot" is the wrong
 * mental model and "never had one" is the common case.
 *
 * The emailed link lands on crossub_web's public reset page; this app deliberately has no
 * `/reset-password` route, and that stays the one place a password is set.
 *
 * The API answers identically whether or not the address has an account, so the confirmation
 * below must NOT confirm existence — and it names no expiry, because a setup link (72h) and a
 * reset (24h) differ and naming either would leak which one the reader was sent.
 */
const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post('/auth/forgot-password', values);
      toast.success('If that address has an account, we have emailed you a link.');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error('Unable to send the email right now. Please try again shortly.');
        return;
      }
      toast.error('Something went wrong. Check your connection and try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Wrench className="size-5" />
        </div>
        <p className="text-lg font-semibold">Set or reset your password</p>
      </div>

      <div className="w-full max-w-md rounded-xl border bg-card p-8">
        <Link
          href={ROUTES.LOGIN}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>

        <p className="text-muted-foreground mb-6 text-sm">
          Enter the email address CROSSUB has on file for you and we&apos;ll send a link.
          This works whether you have signed in before or have never set a password.
        </p>

        {isSubmitSuccessful ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              If that address has an account, the link is on its way. Open it soon — it
              expires for security — then choose a password and come back to sign in.
            </p>
            <p className="text-muted-foreground text-sm">
              Nothing after a few minutes? Check your junk folder, and make sure you used
              the address your jobs are sent to.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={ROUTES.LOGIN}>Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com.au"
                  autoComplete="email"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Email me a link'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
