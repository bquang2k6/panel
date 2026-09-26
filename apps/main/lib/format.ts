export function formatCurrency(amount: number, currency = "VND"): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Xử lý an toàn chuỗi ngày/thời gian từ Database (PostgreSQL / Supabase).
 * Hỗ trợ định dạng mẫu từ DB: "2026-07-29 05:44:38.660499+00" (có khoảng trắng thay vì 'T').
 */
export function parseDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  let str = String(dateInput).trim();
  // Chuẩn hóa khoảng trắng giữa ngày và giờ thành 'T' theo chuẩn ISO 8601
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:/.test(str)) {
    str = str.replace(/\s+/, "T");
  }

  // Chuẩn hóa múi giờ dạng +00 hoặc +07 thành +00:00 hoặc +07:00 nếu chưa có số phút
  if (/([+-]\d{2})$/.test(str)) {
    str = str.replace(/([+-]\d{2})$/, "$1:00");
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Định dạng ngày/thời gian theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7).
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDate(dateInput);
  if (!d) return "—";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    ...options,
  };

  return new Intl.DateTimeFormat("vi-VN", defaultOptions).format(d);
}

/**
 * Định dạng thời gian tương đối (VD: "5 phút trước", "2 giờ trước") theo mốc giờ Việt Nam.
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  const d = parseDate(dateInput);
  if (!d) return "—";

  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  return formatDate(d);
}

/**
 * Trả về mốc thời gian bắt đầu ngày (00:00:00.000) theo giờ Việt Nam (UTC+7 / Asia/Ho_Chi_Minh).
 * Khi gọi .toISOString() sẽ trả về mốc UTC tương ứng để query Database.
 */
export function getStartOfDayVN(dateInput: Date | string = new Date()): Date {
  const d = parseDate(dateInput) ?? new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return new Date(`${year}-${month}-${day}T00:00:00.000+07:00`);
}

/**
 * Trả về mốc thời gian kết thúc ngày (23:59:59.999) theo giờ Việt Nam (UTC+7 / Asia/Ho_Chi_Minh).
 */
export function getEndOfDayVN(dateInput: Date | string = new Date()): Date {
  const d = parseDate(dateInput) ?? new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return new Date(`${year}-${month}-${day}T23:59:59.999+07:00`);
}

/**
 * Lấy mốc thời gian X ngày trước (bắt đầu ngày 00:00:00.000) theo giờ Việt Nam.
 */
export function getDaysAgoVN(days: number): Date {
  const startToday = getStartOfDayVN();
  startToday.setDate(startToday.getDate() - days);
  return startToday;
}

/**
 * Chuyển đổi chuỗi ngày (VD: "2026-07-29") thành UTC ISO string ở mốc đầu hoặc cuối ngày theo giờ Việt Nam.
 */
export function vnDateToUTCISO(dateStr: string, isEndOfDay = false): string {
  const cleanStr = dateStr.trim();
  if (!cleanStr) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const timeStr = isEndOfDay ? "23:59:59.999" : "00:00:00.000";
    return new Date(`${cleanStr}T${timeStr}+07:00`).toISOString();
  }

  const parsed = parseDate(cleanStr);
  return parsed ? parsed.toISOString() : "";
}

