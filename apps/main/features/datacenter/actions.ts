"use server";

import { createClient } from "@supabase/supabase-js";
import { getSavedConnections } from "./db-actions";
import type {
  Donation,
  DonationPayload,
  NotificationItem,
  NotificationPayload,
  CelebrateItem,
  CelebratePayload,
  OverlayItem,
  OverlayPayload,
  OverlaySection,
  OverlaySectionPayload,
} from "./types";

const API_URL = "https://api.locket-wan.top/locketpro/donations";
const DONATE_STORAGE_KEY = "locket_datacenter_donations";
const NOTIFICATION_STORAGE_KEY = "locket_datacenter_notifications";
const CELEBRATE_STORAGE_KEY = "locket_datacenter_celebrates";
const OVERLAY_STORAGE_KEY = "locket_datacenter_overlays";

// Singleton cache cho DataCenter client — tránh tạo nhiều GoTrueClient
let _datacenterClient: ReturnType<typeof createClient<any>> | null = null;
let _datacenterUrl = "";
let _datacenterKey = "";

/**
 * Khởi tạo Supabase Client từ kết nối đang được KÍCH HOẠT (Active) trong DataCenter.
 * Sử dụng singleton cache theo URL+Key, chỉ tạo mới khi kết nối thay đổi.
 */
export async function getDatacenterSupabaseClient() {
  try {
    const connections = await getSavedConnections();
    // Bỏ qua Supabase gốc (is_primary), chỉ lấy kết nối bổ sung đang active
    const activeConn = connections.find((c) => c.is_active && !c.is_primary);

    if (activeConn && activeConn.supabase_url && activeConn.supabase_key) {
      const cleanUrl = activeConn.supabase_url.trim().replace(/\/$/, "");
      const cleanKey = activeConn.supabase_key.trim();

      // Trả về client cũ nếu URL + Key không đổi
      if (_datacenterClient && _datacenterUrl === cleanUrl && _datacenterKey === cleanKey) {
        return _datacenterClient;
      }

      _datacenterClient = createClient<any>(cleanUrl, cleanKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          storageKey: "datacenter_supabase_auth",
        },
      });
      _datacenterUrl = cleanUrl;
      _datacenterKey = cleanKey;
      return _datacenterClient;
    }
  } catch (err) {
    console.warn("Không thể lấy kết nối DataCenter active:", err);
  }
  return null;
}

// Helper đọc/ghi LocalStorage an toàn (Cache / Fallback)
function getStoredItems<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStoredItems<T>(key: string, items: T[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(items));
  }
}

// ISO Date cố định tránh lỗi Hydration Mismatch khi SSR
const STATIC_DATE_1 = "2026-09-01T12:00:00.000Z";
const STATIC_DATE_2 = "2026-09-02T12:00:00.000Z";

// -------------------------------------------------------------
// 1. DONATE ACTIONS (locketwan_donate)
// -------------------------------------------------------------
const initialDonations: Donation[] = [
  {
    id: "1",
    donorname: "Nguyễn Văn A",
    amount: 100000,
    date: STATIC_DATE_1,
    message: "Cảm ơn locketwan Pro rất nhiều!",
    created_at: STATIC_DATE_1,
  },
  {
    id: "2",
    donorname: "Trần Thị B",
    amount: 50000,
    date: STATIC_DATE_2,
    message: "Ủng hộ dự án phát triển.",
    created_at: STATIC_DATE_2,
  },
];

export const donationActions = {
  async getAll(): Promise<Donation[]> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("locketwan_donate")
          .select("*")
          .order("date", { ascending: false });

        if (!error && data && Array.isArray(data)) {
          setStoredItems(DONATE_STORAGE_KEY, data as Donation[]);
          return data as Donation[];
        }
      } catch (e) {
        console.warn("Lỗi đọc locketwan_donate từ Supabase active:", e);
      }
    }
    return getStoredItems(DONATE_STORAGE_KEY, initialDonations);
  },

  async create(data: DonationPayload): Promise<Donation> {
    const client = await getDatacenterSupabaseClient();
    let newItem: Donation | null = null;

    if (client) {
      try {
        const { data: created, error } = await client
          .from("locketwan_donate")
          .insert([
            {
              donorname: data.donorname,
              amount: Number(data.amount) || 0,
              date: data.date || new Date().toISOString(),
              message: data.message || null,
            },
          ])
          .select()
          .single();

        if (!error && created) {
          newItem = created as Donation;
        }
      } catch (e) {
        console.warn("Lỗi thêm locketwan_donate vào Supabase active:", e);
      }
    }

    if (!newItem) {
      newItem = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `don_${Date.now()}`,
        donorname: data.donorname,
        amount: Number(data.amount) || 0,
        date: data.date || new Date().toISOString(),
        message: data.message,
        created_at: new Date().toISOString(),
      };
    }

    const currentItems = await this.getAll();
    const updated = [newItem, ...currentItems.filter((i) => i.id !== newItem!.id)];
    setStoredItems(DONATE_STORAGE_KEY, updated);
    return newItem;
  },

  async update(id: string | number, data: DonationPayload): Promise<Donation> {
    const client = await getDatacenterSupabaseClient();
    let updatedItem: Donation | null = null;

    if (client) {
      try {
        const { data: updated, error } = await client
          .from("locketwan_donate")
          .update({
            donorname: data.donorname,
            amount: Number(data.amount) || 0,
            date: data.date,
            message: data.message || null,
          })
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          updatedItem = updated as Donation;
        }
      } catch (e) {
        console.warn("Lỗi sửa locketwan_donate trên Supabase active:", e);
      }
    }

    const currentItems = await this.getAll();
    const updatedList = currentItems.map((item) => {
      if (String(item.id) === String(id)) {
        const fallbackObj = {
          ...item,
          donorname: data.donorname,
          amount: Number(data.amount) || 0,
          date: data.date,
          message: data.message,
        };
        return updatedItem || fallbackObj;
      }
      return item;
    });

    setStoredItems(DONATE_STORAGE_KEY, updatedList);
    return updatedItem || updatedList.find((i) => String(i.id) === String(id))!;
  },

  async delete(id: string | number): Promise<void> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        await client.from("locketwan_donate").delete().eq("id", id);
      } catch (e) {
        console.warn("Lỗi xóa locketwan_donate trên Supabase active:", e);
      }
    }

    const currentItems = await this.getAll();
    const updated = currentItems.filter((item) => String(item.id) !== String(id));
    setStoredItems(DONATE_STORAGE_KEY, updated);
  },
};

// -------------------------------------------------------------
// 2. NOTIFICATION ACTIONS (locketwan_notifications)
// -------------------------------------------------------------
const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Thông báo cập nhật hệ thống",
    message: "Hệ thống locketwan Pro nâng cấp phiên bản 1.2.0 với nhiều tính năng mới.",
    pinned: true,
    created_at: STATIC_DATE_1,
  },
  {
    id: "2",
    title: "Bảo trì định kỳ DataCenter",
    message: "Máy chủ lưu trữ sẽ thực hiện bảo trì vào 02:00 sáng ngày mai.",
    pinned: false,
    created_at: STATIC_DATE_2,
  },
];

export const notificationActions = {
  async getAll(): Promise<NotificationItem[]> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("locketwan_notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && Array.isArray(data)) {
          setStoredItems(NOTIFICATION_STORAGE_KEY, data as NotificationItem[]);
          return data as NotificationItem[];
        }
      } catch (e) {
        console.warn("Lỗi đọc locketwan_notifications từ Supabase active:", e);
      }
    }
    return getStoredItems(NOTIFICATION_STORAGE_KEY, initialNotifications);
  },

  async create(data: NotificationPayload): Promise<NotificationItem> {
    const client = await getDatacenterSupabaseClient();
    let newItem: NotificationItem | null = null;

    if (client) {
      try {
        const { data: created, error } = await client
          .from("locketwan_notifications")
          .insert([
            {
              title: data.title || null,
              message: data.message,
              pinned: Boolean(data.pinned),
            },
          ])
          .select()
          .single();

        if (!error && created) {
          newItem = created as NotificationItem;
        }
      } catch (e) {
        console.warn("Lỗi thêm locketwan_notifications:", e);
      }
    }

    if (!newItem) {
      newItem = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `notis_${Date.now()}`,
        title: data.title,
        message: data.message,
        pinned: Boolean(data.pinned),
        created_at: new Date().toISOString(),
      };
    }

    const currentItems = await this.getAll();
    const updated = [newItem, ...currentItems.filter((i) => i.id !== newItem!.id)];
    setStoredItems(NOTIFICATION_STORAGE_KEY, updated);
    return newItem;
  },

  async update(id: string, data: NotificationPayload): Promise<NotificationItem> {
    const client = await getDatacenterSupabaseClient();
    let updatedItem: NotificationItem | null = null;

    if (client) {
      try {
        const { data: updated, error } = await client
          .from("locketwan_notifications")
          .update({
            title: data.title || null,
            message: data.message,
            pinned: Boolean(data.pinned),
          })
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          updatedItem = updated as NotificationItem;
        }
      } catch (e) {
        console.warn("Lỗi sửa notification:", e);
      }
    }

    const currentItems = await this.getAll();
    const updatedList = currentItems.map((item) => {
      if (item.id === id) {
        return updatedItem || { ...item, title: data.title, message: data.message, pinned: Boolean(data.pinned) };
      }
      return item;
    });

    setStoredItems(NOTIFICATION_STORAGE_KEY, updatedList);
    return updatedItem || updatedList.find((i) => i.id === id)!;
  },

  async togglePin(id: string): Promise<NotificationItem> {
    const currentItems = await this.getAll();
    const target = currentItems.find((i) => i.id === id);
    if (!target) throw new Error("Notification not found");

    return this.update(id, {
      title: target.title || "",
      message: target.message,
      pinned: !target.pinned,
    });
  },

  async delete(id: string): Promise<void> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        await client.from("locketwan_notifications").delete().eq("id", id);
      } catch (e) {
        console.warn("Lỗi xóa notification:", e);
      }
    }

    const currentItems = await this.getAll();
    const updated = currentItems.filter((item) => item.id !== id);
    setStoredItems(NOTIFICATION_STORAGE_KEY, updated);
  },
};

// -------------------------------------------------------------
// 3. TIMELINE / CELEBRATE ACTIONS (celebrate_list)
// -------------------------------------------------------------
const initialCelebrates: CelebrateItem[] = [
  {
    id: "1",
    uid: "usr_10293",
    username: "daovandoi",
    active: true,
    note: "Sự kiện kỷ niệm locketwan Pro VIP",
    token: "tok_abc123xyz",
    country_code: "VN",
    created_at: STATIC_DATE_1,
  },
  {
    id: "2",
    uid: "usr_88412",
    username: "locket_user",
    active: true,
    note: "Tài khoản khen thưởng đóng góp",
    token: "tok_def456uvw",
    country_code: "VN",
    created_at: STATIC_DATE_2,
  },
];

export const celebrateActions = {
  async getAll(): Promise<CelebrateItem[]> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("celebrate_list")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && Array.isArray(data)) {
          setStoredItems(CELEBRATE_STORAGE_KEY, data as CelebrateItem[]);
          return data as CelebrateItem[];
        }
      } catch (e) {
        console.warn("Lỗi đọc celebrate_list:", e);
      }
    }
    return getStoredItems(CELEBRATE_STORAGE_KEY, initialCelebrates);
  },

  async create(data: CelebratePayload): Promise<CelebrateItem> {
    const client = await getDatacenterSupabaseClient();
    let newItem: CelebrateItem | null = null;

    if (client) {
      try {
        const { data: created, error } = await client
          .from("celebrate_list")
          .insert([
            {
              uid: data.uid || null,
              username: data.username || null,
              active: Boolean(data.active),
              note: data.note || null,
              token: data.token || null,
              country_code: data.country_code || "VN",
            },
          ])
          .select()
          .single();

        if (!error && created) {
          newItem = created as CelebrateItem;
        }
      } catch (e) {
        console.warn("Lỗi thêm celebrate_list:", e);
      }
    }

    if (!newItem) {
      newItem = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cel_${Date.now()}`,
        uid: data.uid || `usr_${Math.floor(Math.random() * 90000 + 10000)}`,
        username: data.username,
        active: Boolean(data.active),
        note: data.note,
        token: data.token || `tok_${Math.random().toString(36).substring(2, 10)}`,
        country_code: data.country_code || "VN",
        created_at: new Date().toISOString(),
      };
    }

    const currentItems = await this.getAll();
    const updated = [newItem, ...currentItems.filter((i) => i.id !== newItem!.id)];
    setStoredItems(CELEBRATE_STORAGE_KEY, updated);
    return newItem;
  },

  async update(id: string, data: CelebratePayload): Promise<CelebrateItem> {
    const client = await getDatacenterSupabaseClient();
    let updatedItem: CelebrateItem | null = null;

    if (client) {
      try {
        const { data: updated, error } = await client
          .from("celebrate_list")
          .update({
            uid: data.uid || null,
            username: data.username || null,
            active: Boolean(data.active),
            note: data.note || null,
            token: data.token || null,
            country_code: data.country_code || "VN",
          })
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          updatedItem = updated as CelebrateItem;
        }
      } catch (e) {
        console.warn("Lỗi sửa celebrate_list:", e);
      }
    }

    const currentItems = await this.getAll();
    const updatedList = currentItems.map((item) => {
      if (item.id === id) {
        return (
          updatedItem || {
            ...item,
            uid: data.uid,
            username: data.username,
            active: Boolean(data.active),
            note: data.note,
            token: data.token,
            country_code: data.country_code,
          }
        );
      }
      return item;
    });

    setStoredItems(CELEBRATE_STORAGE_KEY, updatedList);
    return updatedItem || updatedList.find((i) => i.id === id)!;
  },

  async toggleActive(id: string): Promise<CelebrateItem> {
    const currentItems = await this.getAll();
    const target = currentItems.find((i) => i.id === id);
    if (!target) throw new Error("Celebrate record not found");

    return this.update(id, {
      uid: target.uid || "",
      username: target.username || "",
      active: !target.active,
      note: target.note || "",
      token: target.token || "",
      country_code: target.country_code || "VN",
    });
  },

  async delete(id: string): Promise<void> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        await client.from("celebrate_list").delete().eq("id", id);
      } catch (e) {
        console.warn("Lỗi xóa celebrate_list:", e);
      }
    }

    const currentItems = await this.getAll();
    const updated = currentItems.filter((item) => item.id !== id);
    setStoredItems(CELEBRATE_STORAGE_KEY, updated);
  },
};

// -------------------------------------------------------------
// 4. OVERLAY STUDIO ACTIONS (locketwan_overlays)
// -------------------------------------------------------------
const initialOverlays: OverlayItem[] = [
  {
    uid: "ov_101",
    section_id: "sec_gold",
    overlay_id: "gold_frame_v1",
    source: "remote",
    order_id: 1,
    active: true,
    daily_start_hour: 0,
    daily_end_hour: 24,
    type: "frame",
    background: {},
    icon: {},
    text: "VIP Gold Member",
    text_color: "#FFD700",
    max_lines: 1,
    effect: "sparkle_gold",
    is_editable: true,
    start_at: null,
    end_at: null,
    created_at: STATIC_DATE_1,
    updated_at: STATIC_DATE_1,
  },
  {
    uid: "ov_102",
    section_id: "sec_neon",
    overlay_id: "neon_light_v2",
    source: "local",
    order_id: 2,
    active: true,
    daily_start_hour: 0,
    daily_end_hour: 24,
    type: "badge",
    background: {},
    icon: {},
    text: "Cyberpunk Neon",
    text_color: "#00FFFF",
    max_lines: 1,
    effect: "neon_pulse",
    is_editable: false,
    start_at: null,
    end_at: null,
    created_at: STATIC_DATE_2,
    updated_at: STATIC_DATE_2,
  },
];

export const overlayActions = {
  async getAll(): Promise<OverlayItem[]> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("locketwan_overlays")
          .select("*")
          .order("order_id", { ascending: true });

        if (!error && data && Array.isArray(data)) {
          setStoredItems(OVERLAY_STORAGE_KEY, data as OverlayItem[]);
          return data as OverlayItem[];
        }
      } catch (e) {
        console.warn("Lỗi đọc locketwan_overlays:", e);
      }
    }
    return getStoredItems(OVERLAY_STORAGE_KEY, initialOverlays);
  },

  async create(data: OverlayPayload): Promise<OverlayItem> {
    const client = await getDatacenterSupabaseClient();
    let newItem: OverlayItem | null = null;

    if (client) {
      try {
        const { data: created, error } = await client
          .from("locketwan_overlays")
          .insert([{
            section_id: data.section_id || null,
            overlay_id: data.overlay_id,
            source: data.source || "remote",
            order_id: Number(data.order_id) || 0,
            active: Boolean(data.active),
            type: data.type || null,
            background: Object.keys(data.background || {}).length > 0 ? data.background : null,
            icon: data.icon?.type && data.icon.type !== "none" ? data.icon : null,
            text: data.text || null,
            text_color: data.text_color || null,
            effect: data.effect || null,
            is_editable: Boolean(data.is_editable),
            max_lines: Number(data.max_lines) || 1,
            daily_start_hour: data.daily_start_hour ?? null,
            daily_end_hour: data.daily_end_hour ?? null,
            start_at: data.start_at || null,
            end_at: data.end_at || null,
          }])
          .select()
          .single();

        if (!error && created) {
          newItem = created as OverlayItem;
        } else if (error) {
          console.warn("Lỗi thêm locketwan_overlays:", error.message);
        }
      } catch (e) {
        console.warn("Lỗi thêm locketwan_overlays:", e);
      }
    }

    if (!newItem) {
      newItem = {
        uid: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ov_${Date.now()}`,
        section_id: data.section_id || null,
        overlay_id: data.overlay_id,
        source: data.source || "remote",
        order_id: Number(data.order_id) || 0,
        active: Boolean(data.active),
        daily_start_hour: data.daily_start_hour ?? null,
        daily_end_hour: data.daily_end_hour ?? null,
        type: data.type || null,
        background: data.background,
        icon: data.icon,
        text: data.text || null,
        text_color: data.text_color || null,
        max_lines: Number(data.max_lines) || 1,
        effect: data.effect || null,
        is_editable: Boolean(data.is_editable),
        start_at: data.start_at || null,
        end_at: data.end_at || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const currentItems = await this.getAll();
    const updated = [newItem, ...currentItems.filter((i) => i.uid !== newItem!.uid)];
    setStoredItems(OVERLAY_STORAGE_KEY, updated);
    return newItem;
  },

  async update(uid: string, data: OverlayPayload): Promise<OverlayItem> {
    const client = await getDatacenterSupabaseClient();
    let updatedItem: OverlayItem | null = null;

    if (client) {
      try {
        const { data: updated, error } = await client
          .from("locketwan_overlays")
          .update({
            section_id: data.section_id || null,
            overlay_id: data.overlay_id,
            source: data.source || "remote",
            order_id: Number(data.order_id) || 0,
            active: Boolean(data.active),
            type: data.type || null,
            background: Object.keys(data.background || {}).length > 0 ? data.background : null,
            icon: data.icon?.type && data.icon.type !== "none" ? data.icon : null,
            text: data.text || null,
            text_color: data.text_color || null,
            effect: data.effect || null,
            is_editable: Boolean(data.is_editable),
            max_lines: Number(data.max_lines) || 1,
            daily_start_hour: data.daily_start_hour ?? null,
            daily_end_hour: data.daily_end_hour ?? null,
            start_at: data.start_at || null,
            end_at: data.end_at || null,
            updated_at: new Date().toISOString(),
          })
          .eq("uid", uid)
          .select()
          .single();

        if (!error && updated) {
          updatedItem = updated as OverlayItem;
        } else if (error) {
          console.warn("Lỗi sửa locketwan_overlays:", error.message);
        }
      } catch (e) {
        console.warn("Lỗi sửa locketwan_overlays:", e);
      }
    }

    const currentItems = await this.getAll();
    const updatedList = currentItems.map((item) => {
      if (item.uid === uid) {
        return updatedItem || {
          ...item,
          section_id: data.section_id || null,
          overlay_id: data.overlay_id,
          source: data.source,
          order_id: Number(data.order_id) || 0,
          active: Boolean(data.active),
          type: data.type,
          background: data.background,
          icon: data.icon,
          text: data.text || null,
          text_color: data.text_color,
          effect: data.effect || null,
          is_editable: Boolean(data.is_editable),
          max_lines: Number(data.max_lines) || 1,
          daily_start_hour: data.daily_start_hour ?? null,
          daily_end_hour: data.daily_end_hour ?? null,
          start_at: data.start_at || null,
          end_at: data.end_at || null,
          updated_at: new Date().toISOString(),
        };
      }
      return item;
    });

    setStoredItems(OVERLAY_STORAGE_KEY, updatedList);
    return updatedItem || updatedList.find((i) => i.uid === uid)!;
  },

  async toggleActive(uid: string): Promise<OverlayItem> {
    const currentItems = await this.getAll();
    const target = currentItems.find((i) => i.uid === uid);
    if (!target) throw new Error("Overlay item not found");
    const parseBg = (v: any) => typeof v === "string" ? (JSON.parse(v) || {}) : (v || {});
    const parseIcon = (v: any) => typeof v === "string" ? (JSON.parse(v) || { type: "none", data: "" }) : (v || { type: "none", data: "" });

    return this.update(uid, {
      section_id: target.section_id || "",
      overlay_id: target.overlay_id,
      source: target.source || "remote",
      order_id: target.order_id || 0,
      active: !target.active,
      type: target.type || "",
      background: parseBg(target.background),
      icon: parseIcon(target.icon),
      text: target.text || "",
      text_color: target.text_color || "",
      effect: target.effect || "",
      is_editable: target.is_editable,
      max_lines: target.max_lines || 1,
      daily_start_hour: target.daily_start_hour,
      daily_end_hour: target.daily_end_hour,
      start_at: target.start_at || null,
      end_at: target.end_at || null,
    });
  },

  async delete(uid: string): Promise<void> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        await client.from("locketwan_overlays").delete().eq("uid", uid);
      } catch (e) {
        console.warn("Lỗi xóa locketwan_overlays:", e);
      }
    }

    const currentItems = await this.getAll();
    const updated = currentItems.filter((item) => item.uid !== uid);
    setStoredItems(OVERLAY_STORAGE_KEY, updated);
  },
};

// -------------------------------------------------------------
// 5. OVERLAY SECTIONS ACTIONS (locketwan_overlay_sections)
// -------------------------------------------------------------
const SECTION_STORAGE_KEY = "locket_datacenter_overlay_sections";

const initialSections: OverlaySection[] = [];

export const sectionActions = {
  async getAll(): Promise<OverlaySection[]> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("locketwan_overlay_sections")
          .select("*")
          .order("order_id", { ascending: true });

        if (!error && data && Array.isArray(data)) {
          setStoredItems(SECTION_STORAGE_KEY, data as OverlaySection[]);
          return data as OverlaySection[];
        }
      } catch (e) {
        console.warn("Lỗi đọc locketwan_overlay_sections:", e);
      }
    }
    return getStoredItems(SECTION_STORAGE_KEY, initialSections);
  },

  async create(data: OverlaySectionPayload): Promise<OverlaySection> {
    const client = await getDatacenterSupabaseClient();
    let newItem: OverlaySection | null = null;

    if (client) {
      try {
        const { data: created, error } = await client
          .from("locketwan_overlay_sections")
          .insert([{
            id: data.id,
            name: data.name,
            order_id: Number(data.order_id) || 0,
            active: Boolean(data.active),
            badge: data.badge || null,
          }])
          .select()
          .single();

        if (!error && created) {
          newItem = created as OverlaySection;
        } else if (error) {
          throw new Error(error.message);
        }
      } catch (e: any) {
        throw new Error(e?.message || "Lỗi thêm section");
      }
    }

    if (!newItem) {
      newItem = {
        id: data.id,
        name: data.name,
        order_id: Number(data.order_id) || 0,
        active: Boolean(data.active),
        badge: data.badge || null,
      };
    }

    const currentItems = await this.getAll();
    const updated = [...currentItems.filter((i) => i.id !== newItem!.id), newItem].sort((a, b) => a.order_id - b.order_id);
    setStoredItems(SECTION_STORAGE_KEY, updated);
    return newItem;
  },

  async update(id: string, data: OverlaySectionPayload): Promise<OverlaySection> {
    const client = await getDatacenterSupabaseClient();
    let updatedItem: OverlaySection | null = null;

    if (client) {
      try {
        const { data: updated, error } = await client
          .from("locketwan_overlay_sections")
          .update({
            name: data.name,
            order_id: Number(data.order_id) || 0,
            active: Boolean(data.active),
            badge: data.badge || null,
          })
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          updatedItem = updated as OverlaySection;
        } else if (error) {
          throw new Error(error.message);
        }
      } catch (e: any) {
        throw new Error(e?.message || "Lỗi sửa section");
      }
    }

    const currentItems = await this.getAll();
    const updatedList = currentItems.map((item) =>
      item.id === id
        ? (updatedItem || { ...item, name: data.name, order_id: Number(data.order_id) || 0, active: Boolean(data.active), badge: data.badge || null })
        : item
    );
    setStoredItems(SECTION_STORAGE_KEY, updatedList);
    return updatedItem || updatedList.find((i) => i.id === id)!;
  },

  async toggleActive(id: string): Promise<OverlaySection> {
    const items = await this.getAll();
    const target = items.find((i) => i.id === id);
    if (!target) throw new Error("Section not found");
    return this.update(id, { ...target, badge: target.badge || "", active: !target.active });
  },

  async delete(id: string): Promise<void> {
    const client = await getDatacenterSupabaseClient();
    if (client) {
      try {
        await client.from("locketwan_overlay_sections").delete().eq("id", id);
      } catch (e) {
        console.warn("Lỗi xóa section:", e);
      }
    }
    const items = await this.getAll();
    setStoredItems(SECTION_STORAGE_KEY, items.filter((i) => i.id !== id));
  },
};
