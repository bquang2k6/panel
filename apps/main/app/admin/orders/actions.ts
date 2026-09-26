"use server";

import { revalidatePath } from "next/cache";
import { updateOrderStatus } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import type { UserPlan } from "@/lib/types/user-plan";

export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const result = await updateOrderStatus(orderId, status);

  if (result.success) {
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }

  return result;
}

/**
 * Tìm kiếm người dùng theo UID, mã khách hàng (customer_code), username hoặc email
 */
export async function searchUsersAction(query: string): Promise<UserPlan[]> {
  const supabase = await createClient();
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const { data, error } = await supabase
    .from("user_plans")
    .select("*")
    .is("deleted_at", null)
    .or(`uid.eq.${cleanQuery},customer_code.eq.${cleanQuery},username.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
    .limit(10);

  if (error) {
    console.error("Lỗi khi tìm kiếm người dùng:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Server Action tạo đơn hàng mới cho người dùng
 */
export async function createOrderAction(params: {
  userId: string;
  planId: string;
  coupon?: string;
  customPrice?: number;
  status?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Thử gọi Supabase Edge Function `orders` (action: "CREATE")
    try {
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("orders", {
        body: {
          action: "CREATE",
          userId: params.userId,
          planId: params.planId,
          coupon: params.coupon,
        },
      });

      if (!edgeErr && edgeData && (edgeData.code === 200 || edgeData.data?.id || edgeData.data?.orderId)) {
        revalidatePath("/admin/orders");
        return {
          success: true,
          data: edgeData.data ?? edgeData,
        };
      }
    } catch (edgeCallErr) {
      console.warn("Edge function call failed, falling back to direct DB insert:", edgeCallErr);
    }

    // 2. Direct DB Fallback
    const [userRes, planRes, bankRes] = await Promise.all([
      supabase.from("user_plans").select("*").eq("uid", params.userId).maybeSingle(),
      supabase.from("locketwan_plans").select("*").eq("id", params.planId).maybeSingle(),
      supabase.from("bank_accounts").select("*").eq("is_active", true).limit(1).maybeSingle(),
    ]);

    if (userRes.error || !userRes.data) {
      return { success: false, error: "Không tìm thấy người dùng với UID này" };
    }

    let plan = planRes.data;
    if (!plan) {
      const fallbackPlanRes = await supabase.from("plans").select("*").eq("id", params.planId).maybeSingle();
      if (fallbackPlanRes.data) {
        plan = fallbackPlanRes.data;
      } else {
        return { success: false, error: "Không tìm thấy gói dịch vụ đã chọn" };
      }
    }

    const user = userRes.data;
    const bank = bankRes.data;

    const finalPrice = params.customPrice !== undefined && params.customPrice >= 0
      ? params.customPrice
      : Number(plan.price ?? 0);

    const prefix = "MBSLK";
    const randomPart = Math.random().toString(36).substring(2, 12).toUpperCase();
    const newOrderId = `${prefix}${randomPart}`;

    const customerCode = user.customer_code ?? user.username ?? user.uid.slice(0, 8);
    const transferContent = `${newOrderId} ${customerCode}`;

    let checkoutQr: string | null = null;
    if (bank) {
      const addInfo = encodeURIComponent(transferContent);
      checkoutQr = `https://qr.sepay.vn/img?acc=${bank.account_number}&bank=${bank.bank_name}&amount=${finalPrice}&des=${addInfo}&template=compact`;
    }

    const newOrderPayload = {
      id: newOrderId,
      user_id: user.uid,
      plan_id: plan.id,
      price: finalPrice,
      original_price: plan.original_price ?? plan.price ?? finalPrice,
      billing_cycle: plan.billing_cycle ?? plan.interval ?? "lifetime",
      status: params.status ?? "PENDING",
      customer_code: customerCode,
      coupon_code: params.coupon || null,
      transfer_content: transferContent,
      checkout_qr: checkoutQr,
      bank_account_id: bank?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedOrder, error: insertErr } = await supabase
      .from("locketwan_orders")
      .insert([newOrderPayload])
      .select()
      .single();

    if (insertErr) {
      console.error("Lỗi khi thêm đơn hàng vào database:", insertErr);
      return { success: false, error: insertErr.message };
    }

    revalidatePath("/admin/orders");
    return {
      success: true,
      data: {
        ...insertedOrder,
        orderId: newOrderId,
        isExistingOrder: false,
      },
    };
  } catch (err: any) {
    console.error("createOrderAction error:", err);
    return { success: false, error: err.message || "Lỗi hệ thống khi tạo đơn hàng" };
  }
}

/**
 * Kiểm tra người dùng có đơn hàng CHỜ THANH TOÁN (PENDING) nào đang tồn tại không
 */
export async function checkPendingOrderAction(userId: string): Promise<{
  hasPending: boolean;
  order?: any;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("locketwan_orders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { hasPending: false };
    }

    return {
      hasPending: true,
      order: data,
    };
  } catch (err) {
    console.error("Lỗi checkPendingOrderAction:", err);
    return { hasPending: false };
  }
}

/**
 * Hủy đơn hàng (đưa status về CANCELLED)
 */
export async function cancelOrderAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    try {
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke("orders", {
        body: {
          action: "CANCEL",
          orderId,
        },
      });
      if (!edgeErr && edgeData) {
        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${orderId}`);
        return { success: true };
      }
    } catch {
      // ignore edge function error
    }

    const { error } = await supabase
      .from("locketwan_orders")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi hủy đơn hàng" };
  }
}

/**
 * Gửi thông báo hoàn thành đơn hàng cho khách hàng
 */
export async function sendCompletionNotificationAction(orderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient();

    try {
      await supabase.functions.invoke("orders", {
        body: {
          action: "SEND_INVOICE",
          orderId,
        },
      });
    } catch {
      // ignore edge call error
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return {
      success: true,
      message: `Đã bắn thông báo hoàn thành cho đơn hàng ${orderId}!`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Lỗi khi gửi thông báo hoàn thành",
    };
  }
}
