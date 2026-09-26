"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MembershipStatus, OwnershipType } from "@/lib/types/membership";
import { updateMembership, createMembership } from "@/lib/queries/memberships";
import type { CreateMembershipPayload } from "@/lib/queries/memberships";

/**
 * Server Action cập nhật membership
 */
export async function updateMembershipAction(
  id: string,
  updates: Partial<{
    status: MembershipStatus;
    ownership_type: OwnershipType;
    plan_id: string;
    start_at: string;
    purchase_date: string;
    expires_at: string;
    payment_method: string | null;
    order_id: string | null;
  }>
): Promise<{ success: boolean; error?: string }> {
  const result = await updateMembership(id, updates);

  if (result.success) {
    revalidatePath("/admin/users/memberships");
  }

  return result;
}

/**
 * Server Action tạo membership mới
 */
export async function createMembershipAction(
  payload: CreateMembershipPayload
): Promise<{ success: boolean; data?: any; error?: string }> {
  const result = await createMembership(payload);

  if (result.success) {
    revalidatePath("/admin/users/memberships");
  }

  return result;
}

/**
 * Server Action xóa (soft expire) membership
 */
export async function expireMembershipAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const result = await updateMembership(id, { status: "EXPIRED" });

  if (result.success) {
    revalidatePath("/admin/users/memberships");
  }

  return result;
}

/**
 * Tìm kiếm user cho form tạo membership
 */
export async function searchUsersForMembershipAction(query: string): Promise<any[]> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = createAdminClient();
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("user_plans")
    .select("uid, username, display_name, email, customer_code, profile_picture")
    .is("deleted_at", null)
    .or(
      `uid.ilike.%${q}%,customer_code.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%,display_name.ilike.%${q}%`
    )
    .limit(10);

  if (error) {
    console.error("searchUsersForMembershipAction error:", error);
    return [];
  }
  return data ?? [];
}
