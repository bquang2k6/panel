// types/plan.ts

export interface PlanFeature {
  title: string;
  description?: string;
  icon?: string;
}

export interface Plan {
  id: string;

  name: string;
  description: string | null;

  price: number;
  original_price: number | null;
  currency: string;

  billing_cycle: string;
  duration_days: number;

  recommended: boolean;
  active: boolean;
  hidden: boolean;

  created_at: string | null;

  max_members: number;

  feature_details: PlanFeature[];
}