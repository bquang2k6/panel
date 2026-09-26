// --- DONATE (locketwan_donate) ---
export interface Donation {
  id: string | number;
  donorname: string;
  amount: number;
  date: string;
  message: string;
  created_at?: string;
}

export interface DonationPayload {
  donorname: string;
  amount: string;
  date: string;
  message: string;
}

// --- THÔNG BÁO (locketwan_notifications) ---
export interface NotificationItem {
  id: string;
  title: string | null;
  message: string;
  pinned: boolean;
  created_at?: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  pinned: boolean;
}

// --- TIMELINE / CELEBRATE (celebrate_list) ---
export interface CelebrateItem {
  id: string;
  uid: string | null;
  active: boolean;
  note: string | null;
  username: string | null;
  token: string | null;
  country_code: string | null;
  created_at?: string;
}

export interface CelebratePayload {
  uid: string;
  username: string;
  active: boolean;
  note: string;
  token: string;
  country_code: string;
}

// --- OVERLAY SECTIONS (locketwan_overlay_sections) ---
export interface OverlaySection {
  id: string;
  name: string;
  order_id: number;
  active: boolean;
  badge: string | null;
}

export interface OverlaySectionPayload {
  id: string;
  name: string;
  order_id: number;
  active: boolean;
  badge: string;
}

// --- OVERLAY BACKGROUND (JSONB) ---
// Có thể có dạng: {"colors": ["#F8C8DC", "#E75480"], "image": {"data": "star_sign_background", "type": "image", "source": "local"}}
export type OverlayBackground = Record<string, any>;

// --- OVERLAY ICON (JSONB) ---
// Có thể có dạng: {"data": "https://...", "type": "image", "source": "url"} hoặc {"data": "🥂", "type": "emoji"}
export type OverlayIconType = "emoji" | "image" | "none" | string;
export type OverlayIcon = Record<string, any>;

// --- OVERLAY STUwan (locketwan_overlays) ---
export interface OverlayItem {
  uid: string;
  section_id: string | null;
  overlay_id: string;
  source: "local" | "remote" | string | null;
  order_id: number;
  active: boolean;
  daily_start_hour: number | null;
  daily_end_hour: number | null;
  type: string | null;
  // JSONB fields - Supabase có thể trả về dạng string hoặc object
  background: OverlayBackground | string | null;
  icon: OverlayIcon | string | null;
  text: string | null;
  text_color: string | null;
  max_lines: number;
  created_at?: string;
  updated_at?: string;
  effect: string | null;
  is_editable: boolean;
  start_at?: string | null;
  end_at?: string | null;
}

export interface OverlayPayload {
  section_id: string;
  overlay_id: string;
  source: string;
  order_id: number;
  active: boolean;
  type: string;
  background: OverlayBackground;
  icon: OverlayIcon;
  text: string;
  text_color: string;
  effect: string;
  is_editable: boolean;
  max_lines: number;
  daily_start_hour: number | null;
  daily_end_hour: number | null;
  start_at: string | null;
  end_at: string | null;
}