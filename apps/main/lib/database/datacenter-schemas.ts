export interface TableSqlSchema {
  id: string;
  name: string;
  tableName: string;
  sql: string;
}

export const FULL_DATACENTER_SQL = `-- 1. BẢNG QUẢN LÝ KẾT NỐI DATABASE (database_connections)
CREATE TABLE IF NOT EXISTS public.database_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Supabase Connection',
    supabase_url TEXT NOT NULL,
    supabase_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'connected',
    last_tested_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.database_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated admin full access" ON public.database_connections FOR ALL TO authenticated USING (true);

-- 2. BẢNG DANH MỤC OVERLAY SECTIONS (locketdio_overlay_sections)
CREATE TABLE IF NOT EXISTS public.locketdio_overlay_sections (
  id text NOT NULL,
  name text NOT NULL,
  order_id integer NULL DEFAULT 0,
  active boolean NULL DEFAULT true,
  badge text NULL,
  CONSTRAINT locketdio_overlay_sections_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 3. BẢNG OVERLAY STUDIO (locketdio_overlays)
CREATE TABLE IF NOT EXISTS public.locketdio_overlays (
  uid uuid NOT NULL DEFAULT gen_random_uuid (),
  section_id text NULL,
  overlay_id text NOT NULL,
  source text NULL,
  order_id integer NULL DEFAULT 0,
  active boolean NULL DEFAULT true,
  daily_start_hour numeric(4, 2) NULL,
  daily_end_hour numeric(4, 2) NULL,
  type text NULL,
  background jsonb NULL DEFAULT '{}'::jsonb,
  icon jsonb NULL DEFAULT '{}'::jsonb,
  text text NULL,
  text_color character varying(9) NULL,
  max_lines smallint NULL DEFAULT '1'::smallint,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  effect text NULL,
  is_editable boolean NOT NULL DEFAULT false,
  CONSTRAINT locketdio_overlays_pkey PRIMARY KEY (uid),
  CONSTRAINT locketdio_overlays_section_id_fkey FOREIGN KEY (section_id) REFERENCES locketdio_overlay_sections (id) ON DELETE CASCADE,
  CONSTRAINT locketdio_overlays_source_check CHECK ((source = ANY (ARRAY['local'::text, 'remote'::text])))
) TABLESPACE pg_default;

-- 4. BẢNG QUẢN LÝ DONATE (locketdio_donate)
CREATE TABLE IF NOT EXISTS public.locketdio_donate (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  donorname text NOT NULL,
  amount numeric NOT NULL,
  date timestamp without time zone NOT NULL,
  message text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT locketdio_donate_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 5. BẢNG THÔNG BÁO HỆ THỐNG (locketdio_notifications)
CREATE TABLE IF NOT EXISTS public.locketdio_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  title text NULL,
  message text NOT NULL,
  pinned boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT locketdio_notis_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 6. BẢNG CELEBRATE / TIMELINE LIST (celebrate_list)
CREATE TABLE IF NOT EXISTS public.celebrate_list (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  uid text NULL,
  active boolean NOT NULL DEFAULT true,
  note text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  username text NULL,
  token text NULL,
  country_code text NULL DEFAULT 'VN'::text,
  CONSTRAINT celebrate_list_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;`;

export const DATACENTER_SQL_SCHEMAS: TableSqlSchema[] = [
  {
    id: "all",
    name: "Tất cả bảng DataCenter (Full Script)",
    tableName: "all",
    sql: FULL_DATACENTER_SQL,
  },
  {
    id: "database_connections",
    name: "1. database_connections (Quản lý DB)",
    tableName: "database_connections",
    sql: `CREATE TABLE IF NOT EXISTS public.database_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  name character varying(255) NOT NULL DEFAULT 'Supabase Connection'::character varying,
  supabase_url text NOT NULL,
  supabase_key text NOT NULL,
  is_active boolean NULL DEFAULT true,
  status character varying(50) NULL DEFAULT 'connected'::character varying,
  last_tested_at timestamp with time zone NULL DEFAULT now(),
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT database_connections_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_database_connections_status ON public.database_connections USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_database_connections_is_active ON public.database_connections USING btree (is_active) TABLESPACE pg_default;

ALTER TABLE public.database_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access database_connections" ON public.database_connections FOR ALL USING (true) WITH CHECK (true);`,
  },
  {
    id: "locketdio_overlay_sections",
    name: "2. locketdio_overlay_sections (Danh mục Overlay)",
    tableName: "locketdio_overlay_sections",
    sql: `CREATE TABLE IF NOT EXISTS public.locketdio_overlay_sections (
  id text NOT NULL,
  name text NOT NULL,
  order_id integer NULL DEFAULT 0,
  active boolean NULL DEFAULT true,
  badge text NULL,
  CONSTRAINT locketdio_overlay_sections_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;`,
  },
  {
    id: "locketdio_overlays",
    name: "3. locketdio_overlays (Overlay Studio)",
    tableName: "locketdio_overlays",
    sql: `CREATE TABLE IF NOT EXISTS public.locketdio_overlays (
  uid uuid NOT NULL DEFAULT gen_random_uuid (),
  section_id text NULL,
  overlay_id text NOT NULL,
  source text NULL,
  order_id integer NULL DEFAULT 0,
  active boolean NULL DEFAULT true,
  daily_start_hour numeric(4, 2) NULL,
  daily_end_hour numeric(4, 2) NULL,
  type text NULL,
  background jsonb NULL DEFAULT '{}'::jsonb,
  icon jsonb NULL DEFAULT '{}'::jsonb,
  text text NULL,
  text_color character varying(9) NULL,
  max_lines smallint NULL DEFAULT '1'::smallint,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  effect text NULL,
  is_editable boolean NOT NULL DEFAULT false,
  CONSTRAINT locketdio_overlays_pkey PRIMARY KEY (uid),
  CONSTRAINT locketdio_overlays_section_id_fkey FOREIGN KEY (section_id) REFERENCES locketdio_overlay_sections (id) ON DELETE CASCADE,
  CONSTRAINT locketdio_overlays_source_check CHECK ((source = ANY (ARRAY['local'::text, 'remote'::text])))
) TABLESPACE pg_default;`,
  },
  {
    id: "locketdio_donate",
    name: "4. locketdio_donate (Quản lý Donate)",
    tableName: "locketdio_donate",
    sql: `CREATE TABLE IF NOT EXISTS public.locketdio_donate (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  donorname text NOT NULL,
  amount numeric NOT NULL,
  date timestamp without time zone NOT NULL,
  message text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT locketdio_donate_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;`,
  },
  {
    id: "locketdio_notifications",
    name: "5. locketdio_notifications (Thông báo)",
    tableName: "locketdio_notifications",
    sql: `CREATE TABLE IF NOT EXISTS public.locketdio_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  title text NULL,
  message text NOT NULL,
  pinned boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT locketdio_notis_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;`,
  },
  {
    id: "celebrate_list",
    name: "6. celebrate_list (Timeline / Celebrate)",
    tableName: "celebrate_list",
    sql: `CREATE TABLE IF NOT EXISTS public.celebrate_list (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  uid text NULL,
  active boolean NOT NULL DEFAULT true,
  note text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  username text NULL,
  token text NULL,
  country_code text NULL DEFAULT 'VN'::text,
  CONSTRAINT celebrate_list_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;`,
  },
];
