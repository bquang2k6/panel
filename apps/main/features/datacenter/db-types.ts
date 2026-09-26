export interface DatabaseConnection {
  id: string;
  name: string;
  supabase_url: string;
  supabase_key: string;
  is_active: boolean;
  is_primary?: boolean; // true = Supabase gốc (không thể xóa, không có nút)
  status: "connected" | "disconnected" | "error" | "testing";
  last_tested_at: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConnectionPayload {
  name: string;
  supabase_url: string;
  supabase_key: string;
  is_active?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  pingMs?: number;
  statusCode?: number;
}
