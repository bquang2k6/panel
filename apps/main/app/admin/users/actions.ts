"use server";

import { revalidatePath } from "next/cache";
import {
  updateUser,
  toggleUserActive,
  softDeleteUser,
  restoreUser,
} from "@/lib/queries/users";
import type { UserPlan } from "@/lib/types/user-plan";

export async function updateUserAction(
  uid: string,
  updates: Partial<Pick<UserPlan, "username" | "display_name" | "email" | "phone" | "customer_code" | "is_active">>
): Promise<{ success: boolean; error?: string }> {
  const result = await updateUser(uid, updates);

  if (result.success) {
    revalidatePath("/admin/users");
  }

  return result;
}

export async function toggleUserActiveAction(
  uid: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  const result = await toggleUserActive(uid, is_active);

  if (result.success) {
    revalidatePath("/admin/users");
  }

  return result;
}

export async function softDeleteUserAction(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  const result = await softDeleteUser(uid);

  if (result.success) {
    revalidatePath("/admin/users");
  }

  return result;
}

export async function restoreUserAction(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  const result = await restoreUser(uid);

  if (result.success) {
    revalidatePath("/admin/users");
  }

  return result;
}
