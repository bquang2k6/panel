-- =============================================================================
-- SQL SCRIPT: CREATE VIEWS & RPC FUNCTIONS FOR DASHBOARD LOCKETwan
-- Chuyển đổi logic truy vấn bảng trực tiếp từ JS client sang View và RPCs (Supabase / PostgreSQL)
-- Tối ưu hóa toàn bộ tính toán mốc thời gian theo Múi giờ Việt Nam (Asia/Ho_Chi_Minh - UTC+7)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. VIEWS
-- (Sử dụng DROP VIEW IF EXISTS ... CASCADE để tránh lỗi 42P16 khi thay đổi thứ tự/tên cột)
-- -----------------------------------------------------------------------------

-- 1.1 View danh sách đơn hàng kèm ngân hàng & user
DROP VIEW IF EXISTS public.v_locketwan_orders CASCADE;
CREATE VIEW public.v_locketwan_orders AS
SELECT 
  o.id,
  o.user_id,
  o.plan_id,
  o.price,
  o.original_price,
  o.billing_cycle,
  o.status,
  o.created_at,
  o.updated_at,
  o.customer_code,
  o.checkout_url,
  o.transfer_content,
  o.checkout_qr,
  o.coupon_code,
  o.transaction_id,
  o.invoice_id,
  o.invoice_sent,
  CASE 
    WHEN b.id IS NOT NULL THEN jsonb_build_object(
      'id', b.id,
      'bank_name', b.bank_name,
      'bin', b.bin,
      'account_number', b.account_number,
      'account_name', b.account_name,
      'is_active', b.is_active,
      'created_at', b.created_at,
      'updated_at', b.updated_at,
      'bank_logo', b.bank_logo,
      'bank_fullname', b.bank_fullname
    )
    ELSE NULL 
  END AS bank_info,
  CASE 
    WHEN u.uid IS NOT NULL THEN jsonb_build_object(
      'uid', u.uid,
      'username', u.username,
      'email', u.email,
      'display_name', u.display_name,
      'profile_picture', u.profile_picture,
      'customer_code', u.customer_code,
      'phone', u.phone
    )
    ELSE NULL 
  END AS user_info
FROM public.locketwan_orders o
LEFT JOIN public.bank_accounts b ON o.bank_account_id = b.id
LEFT JOIN public.user_plans u ON o.user_id = u.uid;

-- 1.2 View chi tiết đơn hàng nâng cao (full details)
DROP VIEW IF EXISTS public.v_locketwan_orderfull CASCADE;
CREATE VIEW public.v_locketwan_orderfull AS
SELECT 
  o.id AS order_id,
  o.transaction_id,
  o.created_at,
  CASE 
    WHEN b.id IS NOT NULL THEN jsonb_build_object(
      'id', b.id,
      'bank_name', b.bank_name,
      'bin', b.bin,
      'account_number', b.account_number,
      'account_name', b.account_name,
      'is_active', b.is_active,
      'bank_logo', b.bank_logo,
      'bank_fullname', b.bank_fullname
    )
    ELSE NULL 
  END AS bank_info,
  to_jsonb(o.*) AS order_info,
  CASE 
    WHEN p.id IS NOT NULL THEN to_jsonb(p.*)
    ELSE NULL 
  END AS plan_info,
  CASE 
    WHEN m.id IS NOT NULL THEN to_jsonb(m.*)
    ELSE NULL 
  END AS membership_info,
  CASE 
    WHEN u.uid IS NOT NULL THEN to_jsonb(u.*)
    ELSE NULL 
  END AS user_info
FROM public.locketwan_orders o
LEFT JOIN public.bank_accounts b ON o.bank_account_id = b.id
LEFT JOIN public.locketwan_plans p ON o.plan_id = p.id
LEFT JOIN public.locketwan_memberships m ON m.order_id = o.id
LEFT JOIN public.user_plans u ON o.user_id = u.uid;

-- 1.3 View danh sách memberships với user_info và plan_info
DROP VIEW IF EXISTS public.v_locketwan_memberships_detail CASCADE;
CREATE VIEW public.v_locketwan_memberships_detail AS
SELECT 
  m.id,
  m.uid,
  m.plan_id,
  m.status,
  m.ownership_type,
  m.start_at,
  m.purchase_date,
  m.expires_at,
  m.payment_method,
  m.created_at,
  m.updated_at,
  m.order_id,
  CASE 
    WHEN u.uid IS NOT NULL THEN jsonb_build_object(
      'uid', u.uid,
      'username', u.username,
      'display_name', u.display_name,
      'email', u.email,
      'customer_code', u.customer_code,
      'profile_picture', u.profile_picture
    )
    ELSE NULL 
  END AS user_info,
  CASE 
    WHEN p.id IS NOT NULL THEN jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'billing_cycle', p.billing_cycle,
      'price', p.price
    )
    ELSE NULL 
  END AS plan_info
FROM public.locketwan_memberships m
LEFT JOIN public.user_plans u ON m.uid = u.uid
LEFT JOIN public.locketwan_plans p ON m.plan_id = p.id;


-- -----------------------------------------------------------------------------
-- 2. RPC FUNCTIONS (Stored Procedures - 100% Giờ Việt Nam Asia/Ho_Chi_Minh)
-- -----------------------------------------------------------------------------

-- 2.1 RPC: Thống kê tổng quan Dashboard (Gom 12 sub-query client về 1 function DB)
DROP FUNCTION IF EXISTS public.get_dashboard_stats();
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today timestamptz;
  v_30_days_ago timestamptz;
  v_60_days_ago timestamptz;

  v_total_users bigint;
  v_active_users bigint;
  v_total_orders bigint;
  v_revenue numeric;
  v_prev_revenue numeric;

  v_recent_users bigint;
  v_prev_users bigint;
  v_recent_orders bigint;
  v_prev_orders bigint;

  v_today_users bigint;
  v_today_orders bigint;
  v_today_completed_orders bigint;
  v_today_revenue numeric;

  v_user_growth numeric := 0;
  v_order_growth numeric := 0;
  v_revenue_growth numeric := 0;
BEGIN
  DECLARE
    v_first_day_of_month timestamptz;
    v_first_day_of_prev_month timestamptz;
  BEGIN
    v_first_day_of_month := date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    v_first_day_of_prev_month := (date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - INTERVAL '1 month') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    v_today := date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    v_30_days_ago := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' - INTERVAL '30 days') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    v_60_days_ago := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh' - INTERVAL '60 days') AT TIME ZONE 'Asia/Ho_Chi_Minh';


  -- 1. Tổng user (chưa bị xóa mềm)
  SELECT COUNT(*) INTO v_total_users FROM public.user_plans WHERE deleted_at IS NULL;

  -- 2. User hoạt động (kiểm tra upload_stats trong tháng này)
  SELECT COUNT(*) INTO v_active_users FROM public.upload_stats WHERE updated_at >= v_first_day_of_month;

  -- 3. Tổng đơn thành công (PAID) TRONG THÁNG HIỆN TẠI
  SELECT COUNT(*) INTO v_total_orders 
  FROM public.locketwan_orders 
  WHERE status = 'PAID' AND updated_at >= v_first_day_of_month;

  -- 4. Tổng doanh thu (PAID) trong tháng hiện tại
  SELECT COALESCE(SUM(price), 0) INTO v_revenue FROM public.locketwan_orders WHERE status = 'PAID' AND updated_at >= v_first_day_of_month;

  -- Doanh thu tháng trước
  SELECT COALESCE(SUM(price), 0) INTO v_prev_revenue FROM public.locketwan_orders WHERE status = 'PAID' AND updated_at >= v_first_day_of_prev_month AND updated_at < v_first_day_of_month;

  -- 5. User 30 ngày gần đây & 30-60 ngày trước (tính theo giờ VN)
  SELECT COUNT(*) INTO v_recent_users FROM public.user_plans WHERE created_at >= v_30_days_ago AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_prev_users FROM public.user_plans WHERE created_at >= v_60_days_ago AND created_at < v_30_days_ago AND deleted_at IS NULL;

  -- 6. Đơn thành công tháng này và tháng trước (tính theo giờ VN)
  v_recent_orders := v_total_orders;
  SELECT COUNT(*) INTO v_prev_orders 
  FROM public.locketwan_orders 
  WHERE status = 'PAID' AND updated_at >= v_first_day_of_prev_month AND updated_at < v_first_day_of_month;

  -- 7. Thống kê hôm nay (tính từ 00:00:00 giờ VN)
  SELECT COUNT(*) INTO v_today_users FROM public.user_plans WHERE created_at >= v_today AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_today_orders FROM public.locketwan_orders WHERE created_at >= v_today;
  SELECT COUNT(*) INTO v_today_completed_orders FROM public.locketwan_orders WHERE status = 'PAID' AND updated_at >= v_today;
  SELECT COALESCE(SUM(price), 0) INTO v_today_revenue FROM public.locketwan_orders WHERE status = 'PAID' AND updated_at >= v_today;

  -- Tính % tăng trưởng
  IF v_prev_users > 0 THEN
    v_user_growth := ROUND(((v_recent_users::numeric - v_prev_users::numeric) / v_prev_users::numeric) * 100, 1);
  END IF;

  IF v_prev_orders > 0 THEN
    v_order_growth := ROUND(((v_recent_orders::numeric - v_prev_orders::numeric) / v_prev_orders::numeric) * 100, 1);
  ELSE
    IF v_recent_orders > 0 THEN v_order_growth := 100; ELSE v_order_growth := 0; END IF;
  END IF;

  IF v_prev_revenue > 0 THEN
    v_revenue_growth := ROUND(((v_revenue - v_prev_revenue) / v_prev_revenue) * 100, 1);
  ELSE
    IF v_revenue > 0 THEN v_revenue_growth := 100; ELSE v_revenue_growth := 0; END IF;
  END IF;

  RETURN jsonb_build_object(
    'totalUsers', v_total_users,
    'activeUsers', v_active_users,
    'totalOrders', v_total_orders,
    'revenue', v_revenue,
    'userGrowth', v_user_growth,
    'orderGrowth', v_order_growth,
    'revenueGrowth', v_revenue_growth,
    'todayUsers', v_today_users,
    'todayOrders', v_today_orders,
    'todayCompletedOrders', v_today_completed_orders,
    'todayRevenue', v_today_revenue
  );
END;
$$;


-- 2.2 RPC: Biểu đồ doanh thu theo ngày (Chuẩn giờ Việt Nam DD/MM)
DROP FUNCTION IF EXISTS public.get_revenue_chart_data(integer);
CREATE OR REPLACE FUNCTION public.get_revenue_chart_data(p_days integer DEFAULT 30)
RETURNS TABLE (
  date text,
  revenue numeric,
  orders bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time timestamptz;
BEGIN
  v_start_time := (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_days - 1) || ' days')::interval) AT TIME ZONE 'Asia/Ho_Chi_Minh';

  RETURN QUERY
  WITH day_series AS (
    SELECT generate_series(
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_days - 1) || ' days')::interval,
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 day'::interval
    )::date AS d
  ),
  order_stats AS (
    SELECT 
      (updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS order_date,
      SUM(price) AS daily_revenue,
      COUNT(*) AS daily_orders
    FROM public.locketwan_orders
    WHERE status = 'PAID'
      AND updated_at >= v_start_time
    GROUP BY 1
  )
  SELECT 
    to_char(ds.d, 'DD/MM') AS date,
    COALESCE(os.daily_revenue, 0) AS revenue,
    COALESCE(os.daily_orders, 0) AS orders
  FROM day_series ds
  LEFT JOIN order_stats os ON ds.d = os.order_date
  ORDER BY ds.d ASC;
END;
$$;


-- 2.3 RPC: Biểu đồ số lượng đơn hàng theo trạng thái theo ngày (Chuẩn giờ Việt Nam)
DROP FUNCTION IF EXISTS public.get_orders_chart_data(integer);
CREATE OR REPLACE FUNCTION public.get_orders_chart_data(p_days integer DEFAULT 14)
RETURNS TABLE (
  date text,
  paid bigint,
  pending bigint,
  cancelled bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time timestamptz;
BEGIN
  v_start_time := (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_days - 1) || ' days')::interval) AT TIME ZONE 'Asia/Ho_Chi_Minh';

  RETURN QUERY
  WITH day_series AS (
    SELECT generate_series(
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_days - 1) || ' days')::interval,
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 day'::interval
    )::date AS d
  ),
  order_stats AS (
    SELECT 
      d AS order_date,

      COUNT(*) FILTER (
        WHERE UPPER(status::text) = 'PAID'
        AND (updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d
      ) AS paid_count,

      COUNT(*) FILTER (
        WHERE UPPER(status::text) = 'PENDING'
        AND (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d
      ) AS pending_count,

      COUNT(*) FILTER (
        WHERE UPPER(status::text) IN ('CANCELLED', 'FAILED', 'EXPIRED')
        AND (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d
      ) AS cancelled_count

  FROM (
    SELECT generate_series(
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_days - 1) || ' days')::interval,
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 day'::interval
    )::date AS d
  ) days
    CROSS JOIN public.locketwan_orders
    WHERE
      created_at >= v_start_time
      OR updated_at >= v_start_time
    GROUP BY d
  )
  SELECT 
    to_char(ds.d, 'DD/MM') AS date,
    COALESCE(os.paid_count, 0) AS paid,
    COALESCE(os.pending_count, 0) AS pending,
    COALESCE(os.cancelled_count, 0) AS cancelled
  FROM day_series ds
  LEFT JOIN order_stats os ON ds.d = os.order_date
  ORDER BY ds.d ASC;
END;
$$;


-- 2.4 RPC: Biểu đồ tăng trưởng User mới theo ngày (Chuẩn giờ Việt Nam)
DROP FUNCTION IF EXISTS public.get_users_chart_data(integer);
CREATE OR REPLACE FUNCTION public.get_users_chart_data(p_days integer DEFAULT 30)
RETURNS TABLE (
  date text,
  users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_time timestamptz;
BEGIN
  v_start_time := (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_days - 1) || ' days')::interval) AT TIME ZONE 'Asia/Ho_Chi_Minh';

  RETURN QUERY
  WITH day_series AS (
    SELECT generate_series(
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_days - 1) || ' days')::interval,
      date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 day'::interval
    )::date AS d
  ),
  user_stats AS (
    SELECT 
      (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS user_date,
      COUNT(*) AS user_count
    FROM public.user_plans
    WHERE deleted_at IS NULL
      AND created_at >= v_start_time
    GROUP BY 1
  )
  SELECT 
    to_char(ds.d, 'DD/MM') AS date,
    COALESCE(us.user_count, 0) AS users
  FROM day_series ds
  LEFT JOIN user_stats us ON ds.d = us.user_date
  ORDER BY ds.d ASC;
END;
$$;


-- 2.5 RPC: Phân bổ trạng thái đơn hàng
DROP FUNCTION IF EXISTS public.get_order_status_distribution();
CREATE OR REPLACE FUNCTION public.get_order_status_distribution()
RETURNS TABLE (
  name text,
  value bigint,
  color text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH status_counts AS (
    SELECT 
      UPPER(COALESCE(status::text, 'PENDING')) AS st,
      COUNT(*) AS cnt
    FROM public.locketwan_orders
    GROUP BY 1
  )
  SELECT 
    CASE sc.st
      WHEN 'PAID' THEN 'Đã thanh toán'
      WHEN 'PENDING' THEN 'Chờ thanh toán'
      WHEN 'CANCELLED' THEN 'Đã hủy'
      WHEN 'FAILED' THEN 'Thất bại'
      WHEN 'EXPIRED' THEN 'Hết hạn'
      ELSE sc.st
    END AS name,
    sc.cnt AS value,
    CASE sc.st
      WHEN 'PAID' THEN '#22c55e'
      WHEN 'PENDING' THEN '#f59e0b'
      WHEN 'CANCELLED' THEN '#ef4444'
      WHEN 'FAILED' THEN '#8b5cf6'
      WHEN 'EXPIRED' THEN '#6b7280'
      ELSE '#6b7280'
    END AS color
  FROM status_counts sc
  WHERE sc.cnt > 0;
END;
$$;


-- 2.6 RPC: Thống kê User Stats (trang quản lý Users - Chuẩn giờ Việt Nam)
DROP FUNCTION IF EXISTS public.get_user_stats();
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today timestamptz;
  v_total bigint;
  v_active bigint;
  v_inactive bigint;
  v_deleted bigint;
  v_today_users bigint;
  v_today_active bigint;
BEGIN
  v_today := date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh';

  SELECT COUNT(*) INTO v_total FROM public.user_plans WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_active FROM public.upload_stats;
  SELECT COUNT(*) INTO v_inactive FROM public.user_plans WHERE is_active = false AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_deleted FROM public.user_plans WHERE deleted_at IS NOT NULL;
  SELECT COUNT(*) INTO v_today_users FROM public.user_plans WHERE created_at >= v_today AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_today_active FROM public.upload_stats WHERE updated_at >= v_today;

  RETURN jsonb_build_object(
    'total', v_total,
    'active', v_active,
    'inactive', v_inactive,
    'deleted', v_deleted,
    'today', v_today_users,
    'todayActive', v_today_active
  );
END;
$$;


-- 2.7 RPC: Thống kê Order Stats (trang quản lý Orders - Chuẩn giờ Việt Nam)
DROP FUNCTION IF EXISTS public.get_order_stats();
CREATE OR REPLACE FUNCTION public.get_order_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today timestamptz;
  v_total bigint;
  v_revenue numeric;
  v_pending bigint;
  v_today_orders bigint;
  v_today_completed bigint;
  v_today_pending bigint;
  v_today_revenue numeric;
BEGIN
  v_today := date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh';

  SELECT COUNT(*) INTO v_total FROM public.locketwan_orders;
  SELECT COALESCE(SUM(price), 0) INTO v_revenue FROM public.locketwan_orders WHERE status = 'PAID';
  SELECT COUNT(*) INTO v_pending FROM public.locketwan_orders WHERE status = 'PENDING';
  SELECT COUNT(*) INTO v_today_orders FROM public.locketwan_orders WHERE created_at >= v_today;
  SELECT COUNT(*) INTO v_today_completed FROM public.locketwan_orders WHERE status = 'PAID' AND updated_at >= v_today;
  SELECT COUNT(*) INTO v_today_pending FROM public.locketwan_orders WHERE status = 'PENDING' AND created_at >= v_today;
  SELECT COALESCE(SUM(price), 0) INTO v_today_revenue FROM public.locketwan_orders WHERE status = 'PAID' AND updated_at >= v_today;

  RETURN jsonb_build_object(
    'total', v_total,
    'revenue', v_revenue,
    'pending', v_pending,
    'today', v_today_orders,
    'todayCompleted', v_today_completed,
    'todayPending', v_today_pending,
    'todayRevenue', v_today_revenue
  );
END;
$$;


-- 2.8 RPC: Biểu đồ doanh thu theo tháng (Chuẩn giờ Việt Nam MM/YYYY)
DROP FUNCTION IF EXISTS public.get_monthly_revenue_chart_data(integer);
CREATE OR REPLACE FUNCTION public.get_monthly_revenue_chart_data(p_months integer DEFAULT 12)
RETURNS TABLE (
  month text,
  revenue numeric,
  orders bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT generate_series(
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_months - 1) || ' months')::interval,
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 month'::interval
    )::date AS m
  ),
  order_stats AS (
    SELECT 
      date_trunc('month', updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS order_month,
      SUM(price) AS monthly_revenue,
      COUNT(*) AS monthly_orders
    FROM public.locketwan_orders
    WHERE status = 'PAID'
      AND updated_at >= (date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_months - 1) || ' months')::interval) AT TIME ZONE 'Asia/Ho_Chi_Minh'
    GROUP BY 1
  )
  SELECT 
    to_char(ms.m, 'MM/YYYY') AS month,
    COALESCE(os.monthly_revenue, 0) AS revenue,
    COALESCE(os.monthly_orders, 0) AS orders
  FROM month_series ms
  LEFT JOIN order_stats os ON ms.m = os.order_month
  ORDER BY ms.m ASC;
END;
$$;


-- 2.9 RPC: Biểu đồ đơn hàng theo tháng (Chuẩn giờ Việt Nam MM/YYYY)
DROP FUNCTION IF EXISTS public.get_monthly_orders_chart_data(integer);
CREATE OR REPLACE FUNCTION public.get_monthly_orders_chart_data(p_months integer DEFAULT 12)
RETURNS TABLE (
  month text,
  paid bigint,
  pending bigint,
  cancelled bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT generate_series(
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_months - 1) || ' months')::interval,
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 month'::interval
    )::date AS m
  ),
  order_stats AS (
    SELECT
      m AS order_month,

      COUNT(*) FILTER (
        WHERE UPPER(o.status::text) = 'PAID'
        AND date_trunc(
          'month',
          o.updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh'
        )::date = m
      ) AS paid_count,

      COUNT(*) FILTER (
        WHERE UPPER(o.status::text) = 'PENDING'
        AND date_trunc(
          'month',
          o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'
        )::date = m
      ) AS pending_count,

      COUNT(*) FILTER (
        WHERE UPPER(o.status::text) IN ('CANCELLED', 'FAILED', 'EXPIRED')
        AND date_trunc(
          'month',
          o.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'
        )::date = m
      ) AS cancelled_count

    FROM month_series
    CROSS JOIN public.locketwan_orders o
    WHERE
      o.created_at >= (
        date_trunc(
          'month',
          NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'
        ) - ((p_months - 1) || ' months')::interval
      ) AT TIME ZONE 'Asia/Ho_Chi_Minh'
      OR
      o.updated_at >= (
        date_trunc(
          'month',
          NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'
        ) - ((p_months - 1) || ' months')::interval
      ) AT TIME ZONE 'Asia/Ho_Chi_Minh'
    GROUP BY m
  )
  SELECT 
    to_char(ms.m, 'MM/YYYY') AS month,
    COALESCE(os.paid_count, 0) AS paid,
    COALESCE(os.pending_count, 0) AS pending,
    COALESCE(os.cancelled_count, 0) AS cancelled
  FROM month_series ms
  LEFT JOIN order_stats os ON ms.m = os.order_month
  ORDER BY ms.m ASC;
END;
$$;


-- 2.10 RPC: Biểu đồ User mới theo tháng (Chuẩn giờ Việt Nam MM/YYYY)
DROP FUNCTION IF EXISTS public.get_monthly_users_chart_data(integer);
CREATE OR REPLACE FUNCTION public.get_monthly_users_chart_data(p_months integer DEFAULT 12)
RETURNS TABLE (
  month text,
  users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH month_series AS (
    SELECT generate_series(
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_months - 1) || ' months')::interval,
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 month'::interval
    )::date AS m
  ),
  user_stats AS (
    SELECT 
      date_trunc('month', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS user_month,
      COUNT(*) AS user_count
    FROM public.user_plans
    WHERE deleted_at IS NULL
      AND created_at >= (date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_months - 1) || ' months')::interval) AT TIME ZONE 'Asia/Ho_Chi_Minh'
    GROUP BY 1
  )
  SELECT 
    to_char(ms.m, 'MM/YYYY') AS month,
    COALESCE(us.user_count, 0) AS users
  FROM month_series ms
  LEFT JOIN user_stats us ON ms.m = us.user_month
  ORDER BY ms.m ASC;
END;
$$;


-- 2.11 RPC: Thống kê Upload Hàng Ngày (get_daily_upload_stats)
DROP FUNCTION IF EXISTS public.get_daily_upload_stats(date);
CREATE OR REPLACE FUNCTION public.get_daily_upload_stats(
    p_stat_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result jsonb;
    v_new_users integer;
BEGIN

    -- Đếm số lượng user thực tế đăng ký trong ngày p_stat_date (theo giờ VN)
    SELECT COUNT(*)
    INTO v_new_users
    FROM public.user_plans
    WHERE DATE(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = p_stat_date;

    SELECT jsonb_build_object(
        'stat_date', p_stat_date,
        'total_users', COALESCE(v_new_users, 0),
        'total_images', COALESCE(image_uploaded_today, 0),
        'total_videos', COALESCE(video_uploaded_today, 0),
        'total_storage_mb', COALESCE(storage_used_today_mb, 0),
        'total_errors', COALESCE(errors_count, 0),
        'error_details', COALESCE(error_details, '{}'::jsonb)
    )
    INTO v_result
    FROM public.locketwan_daily_stats
    WHERE stat_date = p_stat_date;

    RETURN COALESCE(v_result, jsonb_build_object(
        'stat_date', p_stat_date,
        'total_users', COALESCE(v_new_users, 0),
        'total_images', 0,
        'total_videos', 0,
        'total_storage_mb', 0,
        'total_errors', 0,
        'error_details', '{}'::jsonb
    ));

END;
$function$;


