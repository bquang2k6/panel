// types/membership.ts

export type MembershipStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "REPLACED"
  | "CANCELED"
  | "SUSPENDED";

export type OwnershipType =
  | "PURCHASED"
  | "GIFT"
  | "TRIAL";

export interface Membership {
  id: string;

  uid: string;
  plan_id: string;

  status: MembershipStatus;
  ownership_type: OwnershipType;

  start_at: string;
  purchase_date: string;
  expires_at: string;

  payment_method: string | null;

  created_at: string;
  updated_at: string;

  order_id: string | null;
}