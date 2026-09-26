-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.user_plans (
  uid text NOT NULL,
  username text,
  email text,
  display_name text,
  profile_picture text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  customer_code text UNIQUE,
  renewal_count integer NOT NULL DEFAULT 0,
  phone text,
  deleted_at timestamp with time zone,
  CONSTRAINT user_plans_pkey PRIMARY KEY (uid)
);
CREATE TABLE public.locketwan_plans (
  id text NOT NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0,
  original_price integer,
  currency text NOT NULL DEFAULT 'VND'::text,
  billing_cycle text NOT NULL DEFAULT 'lifetime'::text,
  duration_days integer NOT NULL DEFAULT 0,
  recommended boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  max_members integer NOT NULL DEFAULT 1,
  feature_details jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT locketwan_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.locketwan_coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  max_discount numeric,
  applicable_plans text[],
  min_subtotal numeric,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  per_user_limit integer DEFAULT 1,
  description text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_test boolean DEFAULT false,
  CONSTRAINT locketwan_coupons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  bin text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bank_logo text,
  bank_fullname text,
  CONSTRAINT bank_accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.invoice_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invoice_id text UNIQUE,
  status text DEFAULT 'success'::text CHECK (status = ANY (ARRAY['success'::text, 'no_id'::text, 'failed'::text])),
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.locketwan_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sepay_id bigint NOT NULL UNIQUE,
  gateway text NOT NULL,
  transaction_date timestamp with time zone NOT NULL,
  account_number text,
  sub_account text,
  code text,
  content text,
  transfer_type text NOT NULL CHECK (transfer_type = ANY (ARRAY['in'::text, 'out'::text])),
  transfer_amount numeric NOT NULL,
  accumulated numeric,
  reference_code text NOT NULL,
  description text,
  raw_payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT locketwan_transactions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  origin text,
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.locketwan_daily_stats (
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  total_user_plans integer,
  total_push_subscriptions integer,
  total_storage_used_mb numeric,
  total_image_uploaded integer,
  total_video_uploaded integer,
  new_users_today integer,
  image_uploaded_today integer,
  video_uploaded_today integer,
  storage_used_today_mb numeric,
  created_at timestamp with time zone DEFAULT now(),
  new_push_subscriptions_today integer,
  daily_active_users smallint,
  CONSTRAINT locketwan_daily_stats_pkey PRIMARY KEY (stat_date)
);
CREATE TABLE public.locketwan_memberships_test (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uid text NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  ownership_type text NOT NULL DEFAULT 'PURCHASED',
  start_at timestamp with time zone NOT NULL DEFAULT now(),
  purchase_date timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  order_id text,
  renewal_count bigint
);
CREATE TABLE public.locketwan_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  uid text NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  ownership_type text NOT NULL DEFAULT 'PURCHASED',
  start_at timestamp with time zone NOT NULL DEFAULT now(),
  purchase_date timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  order_id text,
  CONSTRAINT locketwan_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT locketwan_memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.locketwan_plans(id),
  CONSTRAINT locketwan_memberships_uid_fkey FOREIGN KEY (uid) REFERENCES public.user_plans(uid)
);
CREATE TABLE public.locketwan_coupon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_code text NOT NULL,
  user_id text NOT NULL,
  order_id text NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT locketwan_coupon_usage_pkey PRIMARY KEY (id),
  CONSTRAINT locketwan_coupon_usage_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES public.locketwan_coupons(code)
);
CREATE TABLE public.locketwan_membership_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL,
  uid text NOT NULL,
  role text NOT NULL DEFAULT 'MEMBER'::text,
  status text NOT NULL DEFAULT 'ACTIVE'::text,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  removed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locketwan_membership_shares_pkey PRIMARY KEY (id),
  CONSTRAINT locketwan_membership_users_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.locketwan_memberships(id)
);
CREATE TABLE public.locketwan_orders (
  id text NOT NULL,
  user_id text,
  plan_id text,
  price numeric,
  original_price numeric,
  billing_cycle text,
  status text DEFAULT 'PENDING',
  created_at timestamp with time zone DEFAULT now(),
  customer_code text,
  checkout_url text,
  coupon_code text,
  transfer_content text,
  checkout_qr text,
  bank_account_id uuid,
  transaction_id bigint UNIQUE,
  invoice_id text,
  invoice_sent boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locketwan_orders_pkey PRIMARY KEY (id),
  CONSTRAINT locketwan_orders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoice_logs(invoice_id),
  CONSTRAINT locketwan_orders_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.locketwan_plans(id),
  CONSTRAINT locketwan_orders_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.locketwan_transactions(sepay_id),
  CONSTRAINT locketwan_orders_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id),
  CONSTRAINT locketwan_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_plans(uid),
  CONSTRAINT locketwan_orders_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES public.locketwan_coupons(code)
);
CREATE TABLE public.locketwan_plan_badge (
  plan_id text NOT NULL,
  text text,
  gradient text,
  highlight_color text,
  CONSTRAINT locketwan_plan_badge_pkey PRIMARY KEY (plan_id),
  CONSTRAINT locketwan_plan_ui_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.locketwan_plans(id)
);
CREATE TABLE public.locketwan_plan_codes (
  id text NOT NULL,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  months integer NOT NULL,
  price bigint NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT locketwan_plan_codes_pkey PRIMARY KEY (id),
  CONSTRAINT locketwan_planscode_id_fkey FOREIGN KEY (id) REFERENCES public.locketwan_plans(id)
);
CREATE TABLE public.locketwan_plan_features (
  plan_id text NOT NULL,
  video_upload boolean DEFAULT true,
  celebrity_tool boolean DEFAULT true,
  unlimited_posts boolean DEFAULT true,
  data_export_tool boolean DEFAULT true,
  invite_cleanup_tool boolean DEFAULT true,
  restore_streak_tool boolean DEFAULT true,
  remove_watermark boolean DEFAULT true,
  send_friend_request boolean DEFAULT false,
  find_user_by_username boolean DEFAULT true,
  restore_streak_advanced boolean DEFAULT true,
  video_crop_tool boolean DEFAULT false,
  restore_streak_in_calender boolean DEFAULT true,
  CONSTRAINT locketwan_plan_features_pkey PRIMARY KEY (plan_id),
  CONSTRAINT locketwan_plan_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.locketwan_plans(id)
);
CREATE TABLE public.locketwan_plan_limits (
  plan_id text NOT NULL,
  storage_limit_mb integer DEFAULT 100,
  max_uploads integer DEFAULT '-1'::integer,
  image_storage_limit_mb integer DEFAULT '-1'::integer,
  video_storage_limit_mb integer DEFAULT '-1'::integer,
  video_record_max_length integer DEFAULT 10,
  CONSTRAINT locketwan_plan_limits_pkey PRIMARY KEY (plan_id),
  CONSTRAINT locketwan_plan_limits_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.locketwan_plans(id)
);
CREATE TABLE public.push_subscriptionsv2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_subscriptionsv2_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptionsv2_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_plans(uid)
);
CREATE TABLE public.upload_stats (
  uid text NOT NULL,
  image_uploaded integer NOT NULL DEFAULT 0,
  video_uploaded integer NOT NULL DEFAULT 0,
  total_storage_used_mb numeric NOT NULL DEFAULT 0.00,
  error_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT upload_stats_pkey PRIMARY KEY (uid),
  CONSTRAINT upload_stats_uid_fkey FOREIGN KEY (uid) REFERENCES public.user_plans(uid)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text UNIQUE,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);