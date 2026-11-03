import { getSupabaseAdmin } from "../supabase";
import { AllowancePlan } from "../types";

export async function getAllowancePlans(userId: number): Promise<AllowancePlan[]> {
  const supabase = getSupabaseAdmin();
  const { data: plans } = await supabase
    .from("allowance_plans")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: false });

  if (!plans) return [];

  const { data: allTxs } = await supabase
    .from("transactions")
    .select("type, amount, date")
    .eq("user_id", userId);

  const transactions = allTxs || [];

  return plans.map((p) => {
    let spent = 0;
    let received = 0;

    for (const t of transactions) {
      if (t.date >= p.start_date && t.date <= p.end_date) {
        if (t.type === "expense") spent += Number(t.amount) || 0;
        if (t.type === "income") received += Number(t.amount) || 0;
      }
    }

    const remaining = Number(p.spending_limit) - spent;
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    const now = new Date();
    const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    const daysPassed = Math.max(0, Math.round((now.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const daysRemaining = Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 3600 * 24)));
    const avgDailySpent = daysPassed > 0 ? Math.round(spent / Math.min(daysTotal, daysPassed)) : spent;

    return {
      id: Number(p.id),
      user_id: Number(p.user_id),
      name: p.name,
      period_type: p.period_type,
      start_date: p.start_date,
      end_date: p.end_date,
      target_amount: Number(p.target_amount),
      spending_limit: Number(p.spending_limit),
      savings_target: Number(p.savings_target || 0),
      notes: p.notes,
      created_at: p.created_at,
      updated_at: p.updated_at,
      spent_amount: spent,
      received_amount: received,
      remaining_spending: remaining,
      days_total: daysTotal,
      days_remaining: daysRemaining,
      avg_daily_spent: avgDailySpent,
    } as AllowancePlan;
  });
}

export async function createAllowancePlan(
  userId: number,
  data: {
    name: string;
    period_type: "daily" | "weekly" | "monthly";
    start_date: string;
    end_date: string;
    target_amount: number;
    spending_limit: number;
    savings_target: number;
    notes?: string;
  }
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from("allowance_plans")
    .insert({
      user_id: userId,
      name: data.name.trim(),
      period_type: data.period_type,
      start_date: data.start_date,
      end_date: data.end_date,
      target_amount: data.target_amount,
      spending_limit: data.spending_limit,
      savings_target: data.savings_target || 0,
      notes: data.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message || "Gagal membuat rencana uang saku");
  return Number(inserted.id);
}

export async function deleteAllowancePlan(userId: number, planId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("allowance_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", userId);

  return !error;
}
