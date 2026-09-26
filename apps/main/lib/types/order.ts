// types/order.ts

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED";

export interface Order {
  id: string;

  user_id: string | null;
  plan_id: string | null;

  price: number | null;
  original_price: number | null;

  billing_cycle: string | null;
  status: OrderStatus;

  created_at: string;
  updated_at: string;

  customer_code: string | null;

  checkout_url: string | null;
  checkout_qr: string | null;
  transfer_content: string | null;

  coupon_code: string | null;

  bank_account_id: string | null;

  transaction_id: number | null;

  invoice_id: string | null;
  invoice_sent: boolean;
}
