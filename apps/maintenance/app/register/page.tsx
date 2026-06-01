'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TRADE_CATEGORIES } from '@/lib/types';
import { ROUTES } from '@/constants/routes';

const schema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  abn: z.string().min(11, 'Valid ABN required'),
  contactPerson: z.string().min(2, 'Contact person required'),
  mobile: z.string().min(8, 'Mobile required'),
  email: z.string().email('Valid email required'),
  businessAddress: z.string().min(5, 'Address required'),
  tradeCategory: z.string().min(1, 'Select a trade'),
  licenceNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (_values: FormValues) => {
    toast.success('Registration submitted — pending CROSSUB verification');
    router.push(ROUTES.VERIFICATION);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Contractor registration</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Register your company before accepting jobs. Final approval is controlled
            by CROSSUB Admin.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" {...register('companyName')} />
            {errors.companyName && (
              <p className="text-xs text-destructive">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="abn">ABN</Label>
            <Input id="abn" placeholder="12 345 678 901" {...register('abn')} />
            {errors.abn && (
              <p className="text-xs text-destructive">{errors.abn.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input id="contactPerson" {...register('contactPerson')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" {...register('mobile')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business address</Label>
            <Input id="businessAddress" {...register('businessAddress')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeCategory">Trade category</Label>
            <select
              id="tradeCategory"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              {...register('tradeCategory')}
            >
              <option value="">Select trade...</option>
              {TRADE_CATEGORIES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.tradeCategory && (
              <p className="text-xs text-destructive">{errors.tradeCategory.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenceNumber">Licence number (if applicable)</Label>
            <Input id="licenceNumber" {...register('licenceNumber')} />
          </div>

          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Upload licence certificate and insurance documents on the Profile page
              after registration.
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            Submit for verification
          </Button>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Already registered?{' '}
          <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
