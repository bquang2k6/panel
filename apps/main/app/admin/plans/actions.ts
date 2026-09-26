"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export async function createPlanAction(payload: any) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("locketwan_plans").insert(payload);
  if (error) {
    console.error("createPlanAction error:", error);
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function updatePlanAction(id: string, payload: any) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("locketwan_plans").update(payload).eq("id", id);
  if (error) {
    console.error("updatePlanAction error:", error);
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function deletePlanAction(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("locketwan_plans").delete().eq("id", id);
  if (error) {
    console.error("deletePlanAction error:", error);
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/plans");
  return { success: true };
}
