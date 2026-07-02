export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  status?: string;
  systemAccessAgreementRequired?: boolean;
  systemAccessAccepted?: boolean;
  systemAccessAcceptedAt?: string | null;
  systemAccessAgreementVersion?: string | null;
}
