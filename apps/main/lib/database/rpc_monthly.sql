-- =============================================================================
-- SQL SCRIPT: CREATE MONTHLY STATS RPC FUNCTIONS FOR DASHBOARD LOCKETwan
-- Hỗ trợ thống kê Doanh thu, Đơn hàng, và User mới theo tháng (Asia/Ho_Chi_Minh - UTC+7)
-- Bạn có thể dán toàn bộ file này vào Supabase SQL Editor để chạy trực tiếp.
-- =============================================================================

-- ─── RPC: Thống kê tháng hiện tại theo NGÀY (mùng 1 → hôm nay, giờ VN) ─────

-- A. Doanh thu từng ngày trong tháng hiện tại
DROP FUNCTION IF EXISTS public.get_current_month_revenue_daily();
CREATE OR REPLACE FUNCTION public.get_current_month_revenue_daily()
RETURNS TABLE (
  date text,
  revenue numeric,
  orders bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_start timestamptz;
  v_today_end   timestamptz;
BEGIN
  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_today_end   := (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') + INTERVAL '1 day') AT TIME ZONE 'Asia/Ho_Chi_Minh';

  RETURN QUERY
  WITH day_series AS (
    SELECT generate_series(
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      date_trunc('day',   NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 day'::interval
    )::date AS d
  ),
  order_stats AS (
    SELECT
      (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS order_date,
      SUM(price)  AS daily_revenue,
      COUNT(*)    AS daily_orders
    FROM public.locketwan_orders
    WHERE status = 'PAID'
      AND created_at >= v_month_start
      AND created_at <  v_today_end
    GROUP BY 1
  )
  SELECT
    to_char(ds.d, 'DD/MM')             AS date,
    COALESCE(os.daily_revenue, 0)       AS revenue,
    COALESCE(os.daily_orders,  0)       AS orders
  FROM day_series ds
  LEFT JOIN order_stats os ON ds.d = os.order_date
  ORDER BY ds.d ASC;
END;
$$;


-- B. Đơn hàng theo trạng thái từng ngày trong tháng hiện tại
DROP FUNCTION IF EXISTS public.get_current_month_orders_daily();
CREATE OR REPLACE FUNCTION public.get_current_month_orders_daily()
RETURNS TABLE (
  date      text,
  paid      bigint,
  pending   bigint,
  cancelled bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_start timestamptz;
  v_today_end   timestamptz;
BEGIN
  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_today_end   := (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') + INTERVAL '1 day') AT TIME ZONE 'Asia/Ho_Chi_Minh';

  RETURN QUERY
  WITH day_series AS (
    SELECT generate_series(
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      date_trunc('day',   NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
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
        WHERE UPPER(status::text) IN ('CANCELLED','FAILED','EXPIRED')
          AND (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d
      ) AS cancelled_count

    FROM (
      SELECT generate_series(
        date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
        date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
        '1 day'
      )::date AS d
    ) days
    CROSS JOIN public.locketwan_orders
    WHERE created_at >= v_month_start
       OR updated_at >= v_month_start
    GROUP BY d
  )
  SELECT
    to_char(ds.d, 'DD/MM')                 AS date,
    COALESCE(os.paid_count,      0)         AS paid,
    COALESCE(os.pending_count,   0)         AS pending,
    COALESCE(os.cancelled_count, 0)         AS cancelled
  FROM day_series ds
  LEFT JOIN order_stats os ON ds.d = os.order_date
  ORDER BY ds.d ASC;
END;
$$;


-- C. User mới từng ngày trong tháng hiện tại
DROP FUNCTION IF EXISTS public.get_current_month_users_daily();
CREATE OR REPLACE FUNCTION public.get_current_month_users_daily()
RETURNS TABLE (
  date  text,
  users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_start timestamptz;
  v_today_end   timestamptz;
BEGIN
  v_month_start := date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_today_end   := (date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') + INTERVAL '1 day') AT TIME ZONE 'Asia/Ho_Chi_Minh';

  RETURN QUERY
  WITH day_series AS (
    SELECT generate_series(
      date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      date_trunc('day',   NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      '1 day'::interval
    )::date AS d
  ),
  user_stats AS (
    SELECT
      (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS user_date,
      COUNT(*) AS user_count
    FROM public.user_plans
    WHERE deleted_at IS NULL
      AND created_at >= v_month_start
      AND created_at <  v_today_end
    GROUP BY 1
  )
  SELECT
    to_char(ds.d, 'DD/MM')            AS date,
    COALESCE(us.user_count, 0)         AS users
  FROM day_series ds
  LEFT JOIN user_stats us ON ds.d = us.user_date
  ORDER BY ds.d ASC;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────


-- 1. RPC: Biểu đồ doanh thu theo tháng (Mặc định 12 tháng gần nhất)
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


-- 2. RPC: Biểu đồ đơn hàng theo tháng (Mặc định 12 tháng gần nhất)
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
      m AS order_date,

      COUNT(*) FILTER (
        WHERE UPPER(status::text) = 'PAID'
          AND date_trunc('month', updated_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = m
      ) AS paid_count,

      COUNT(*) FILTER (
        WHERE UPPER(status::text) = 'PENDING'
          AND date_trunc('month', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = m
      ) AS pending_count,

      COUNT(*) FILTER (
        WHERE UPPER(status::text) IN ('CANCELLED','FAILED','EXPIRED')
          AND (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d
      ) AS cancelled_count

    FROM (
      SELECT generate_series(
        date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
        date_trunc('day', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh'),
        '1 day'
      )::date AS d
    ) days
    CROSS JOIN public.locketwan_orders
    WHERE created_at >= (date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_months - 1) || ' months')::interval) AT TIME ZONE 'Asia/Ho_Chi_Minh'
       OR updated_at >= (date_trunc('month', NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh') - ((p_months - 1) || ' months')::interval) AT TIME ZONE 'Asia/Ho_Chi_Minh'
    GROUP BY d
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


-- 3. RPC: Biểu đồ User mới theo tháng (Mặc định 12 tháng gần nhất)
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
