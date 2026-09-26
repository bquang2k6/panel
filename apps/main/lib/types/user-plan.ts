export interface UserPlan {
  uid: string;
  username: string | null;
  email: string | null;
  display_name: string | null;
  profile_picture: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;

  customer_code: string | null;
  renewal_count: number;

  phone: string | null;
  deleted_at: string | null;
}