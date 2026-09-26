import { createClient } from "@supabase/supabase-js";
import type {
  DatabaseConnection,
  DatabaseConnectionPayload,
  ConnectionTestResult,
} from "./db-types";

// Singleton cache — chỉ tạo client một lần, tránh cảnh báo GoTrueClient multiple instances
let _primaryClient: ReturnType<typeof createClient<any>> | null = null;
let _primaryUrl = "";
let _primaryKey = "";

/**
 * Khởi tạo Supabase Client của DATABASE GỐC (Primary) theo dạng singleton.
 * Chỉ tạo mới khi URL/key thay đổi.
 */
function getPrimarySupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  if (_primaryClient && _primaryUrl === url && _primaryKey === key) {
    return _primaryClient;
  }

  try {
    _primaryClient = createClient<any>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: "primary_supabase_auth" },
    });
    _primaryUrl = url;
    _primaryKey = key;
    return _primaryClient;
  } catch (e) {
    console.warn("Lỗi khởi tạo Supabase gốc client:", e);
    return null;
  }
}

/**
 * Trả về thông tin Supabase gốc (Primary) dưới dạng DatabaseConnection tĩnh.
 * Luôn hiển thị ở đầu danh sách với is_primary = true.
 */
export function getPrimaryConnectionInfo(): DatabaseConnection {
  const now = new Date().toISOString();
  return {
    id: "primary",
    name: "Supabase Primary (Default)",
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    is_active: true,
    is_primary: true,
    status: "connected",
    last_tested_at: now,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Kiểm tra kết nối tới Supabase bằng URL và Key được cung cấp
 */
export async function testSupabaseConnection(
  url: string,
  key: string
): Promise<ConnectionTestResult> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  try {
    const cleanUrl = url.trim().replace(/\/$/, "");
    const cleanKey = key.trim();

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      return {
        success: false,
        message: "URL không hợp lệ. Vui lòng nhập định dạng https://your-project.supabase.co",
      };
    }

    if (!cleanKey) {
      return {
        success: false,
        message: "Supabase Key không được để trống.",
      };
    }

    // 1. Thử gọi Supabase PostgREST OpenAPI
    const restEndpoint = `${cleanUrl}/rest/v1/`;
    const response = await fetch(restEndpoint, {
      method: "GET",
      headers: {
        apikey: cleanKey,
        Authorization: `Bearer ${cleanKey}`,
        Accept: "application/openapi+json, application/json",
      },
      cache: "no-store",
    });

    const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const pingMs = Math.round(endTime - startTime);

    if (response.ok) {
      return {
        success: true,
        message: `Kết nối Supabase thành công! Phản hồi trong ${pingMs}ms.`,
        pingMs,
        statusCode: response.status,
      };
    }

    // 2. Fallback: Auth Health Check
    const authRes = await fetch(`${cleanUrl}/auth/v1/health`, {
      method: "GET",
      headers: { apikey: cleanKey },
      cache: "no-store",
    });

    if (authRes.ok) {
      return {
        success: true,
        message: `Kết nối Supabase thành công (Auth API)! Phản hồi trong ${pingMs}ms.`,
        pingMs,
        statusCode: authRes.status,
      };
    }

    // 3. Fallback: Supabase JS Client getSession
    try {
      const client = createClient(cleanUrl, cleanKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await client.auth.getSession();
      if (!error) {
        return {
          success: true,
          message: `Khởi tạo Supabase Client thành công! Phản hồi trong ${pingMs}ms.`,
          pingMs,
          statusCode: 200,
        };
      }
    } catch {
      // bỏ qua
    }

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: `Lỗi xác thực (HTTP ${response.status}): API Key chưa chính xác. Vui lòng kiểm tra lại trong Supabase Dashboard → Settings → API.`,
        statusCode: response.status,
      };
    }

    return {
      success: false,
      message: `Không thể truy cập Supabase REST API (HTTP ${response.status}).`,
      statusCode: response.status,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Lỗi kết nối: ${error?.message || "Không thể kết nối tới máy chủ Supabase."}`,
    };
  }
}

/**
 * Lấy danh sách kết nối từ Supabase GỐC (bảng database_connections).
 * Supabase gốc luôn đứng đầu danh sách với is_primary = true.
 * KHÔNG dùng localStorage.
 */
export async function getSavedConnections(): Promise<DatabaseConnection[]> {
  const primary = getPrimaryConnectionInfo();
  const primaryClient = getPrimarySupabaseClient();

  if (!primaryClient) {
    return [primary];
  }

  try {
    const { data, error } = await primaryClient
      .from("database_connections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Lỗi đọc database_connections từ Supabase gốc:", error.message);
      return [primary];
    }

    // Supabase gốc luôn ở đầu, các kết nối khác theo sau
    return [primary, ...(data as DatabaseConnection[])];
  } catch (e) {
    console.warn("Ngoại lệ khi đọc database_connections:", e);
    return [primary];
  }
}

/**
 * Lưu kết nối mới vào Supabase GỐC bảng database_connections.
 * KHÔNG lưu vào localStorage.
 */
export async function saveConnection(
  payload: DatabaseConnectionPayload
): Promise<DatabaseConnection> {
  const cleanUrl = payload.supabase_url.trim().replace(/\/$/, "");
  const cleanKey = payload.supabase_key.trim();
  const name = payload.name?.trim() || "Supabase Database";

  const primaryClient = getPrimarySupabaseClient();
  if (!primaryClient) {
    throw new Error("Không thể kết nối tới Supabase gốc để lưu cấu hình.");
  }

  // Nếu kết nối mới là active, reset tất cả cũ về inactive
  if (payload.is_active) {
    await primaryClient
      .from("database_connections")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .neq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await primaryClient
    .from("database_connections")
    .insert([
      {
        name,
        supabase_url: cleanUrl,
        supabase_key: cleanKey,
        is_active: payload.is_active ?? false,
        status: "connected",
        last_tested_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Lỗi lưu kết nối: ${error.message}`);
  }

  return data as DatabaseConnection;
}

/**
 * Xóa một kết nối khỏi Supabase GỐC bảng database_connections.
 * KHÔNG thể xóa Supabase gốc (is_primary = true).
 */
export async function deleteConnection(id: string): Promise<void> {
  if (id === "primary") {
    throw new Error("Không thể xóa Supabase gốc.");
  }

  const primaryClient = getPrimarySupabaseClient();
  if (!primaryClient) {
    throw new Error("Không thể kết nối tới Supabase gốc.");
  }

  const { error } = await primaryClient
    .from("database_connections")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Lỗi xóa kết nối: ${error.message}`);
  }
}

/**
 * Đặt một kết nối làm Active trên Supabase GỐC bảng database_connections.
 */
export async function setActiveConnection(id: string): Promise<void> {
  if (id === "primary") return; // Supabase gốc luôn active, không cần set

  const primaryClient = getPrimarySupabaseClient();
  if (!primaryClient) {
    throw new Error("Không thể kết nối tới Supabase gốc.");
  }

  // Reset tất cả về inactive
  await primaryClient
    .from("database_connections")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  // Set kết nối chọn thành active
  const { error } = await primaryClient
    .from("database_connections")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Lỗi kích hoạt kết nối: ${error.message}`);
  }
}
