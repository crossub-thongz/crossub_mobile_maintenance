import { Card, CardContent } from '@/components/ui/card';

/** Shown where company profile details would be, while the app has no profile to read. */
export function ProfileUnavailable() {
  return (
    <Card>
      <CardContent className="space-y-1 p-6 text-center">
        <p className="font-semibold">Profile details are not available in the app yet</p>
        <p className="text-muted-foreground text-sm">
          Contact CROSSUB to check or update your company details and verification status.
        </p>
      </CardContent>
    </Card>
  );
}
