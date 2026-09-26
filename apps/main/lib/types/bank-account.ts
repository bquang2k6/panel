export interface BankAccount {
  id: string;

  bank_name: string;
  bank_fullname: string | null;
  bank_logo: string | null;

  bin: string;

  account_number: string;
  account_name: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}