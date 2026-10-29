export interface CompanyProfile {
  name: string;
  address: string;
  contact: string;
  email: string;
  nuit: string;
  tagline: string;
  version?: number | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}
