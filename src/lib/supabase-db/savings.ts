import { getSupabaseAdmin } from "../supabase";
import { SavingsGoal, SavingsContribution } from "../types";

export async function getSavingsGoals(userId: number): Promise<SavingsGoal[]> {
  const supabase = getSupabaseAdmin();
  const { data: goals } = await supabase
    .from("savings_goals")
    .select("*, account:accounts(name)")
    .eq("user_id", userId)
    .order("id", { ascending: false });

  if (!goals) return [];

  const { data: contributions } = await supabase
    .from("savings_contributions")
    .select("goal_id, amount")
    .eq("user_id", userId);

  const contribMap = new Map<number, number>();
  for (const c of contributions || []) {
    const gid = Number(c.goal_id);
    contribMap.set(gid, (contribMap.get(gid) || 0) + (Number(c.amount) || 0));
  }

  return goals.map((g: any) => {
    const gid = Number(g.id);
    const cur = contribMap.get(gid) || 0;
    const tgt = Number(g.target_amount || 1);
    const percentage = tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) : 0;
    const remaining = Math.max(0, tgt - cur);

    return {
      id: gid,
      user_id: Number(g.user_id),
      name: g.name,
      target_amount: tgt,
      current_amount: cur,
      target_date: g.target_date,
      account_id: g.account_id ? Number(g.account_id) : null,
      account_name: g.account?.name,
      notes: g.notes,
      status: g.status,
      created_at: g.created_at,
      updated_at: g.updated_at,
      percentage,
      remaining,
    } as SavingsGoal;
  });
}

export async function createSavingsGoal(
  userId: number,
  data: { name: string; target_amount: number; target_date?: string; account_id?: number; notes?: string }
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: data.name.trim(),
      target_amount: data.target_amount,
      target_date: data.target_date || null,
      account_id: data.account_id || null,
      notes: data.notes?.trim() || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message || "Gagal membuat target tabungan");
  return Number(inserted.id);
}

export async function updateSavingsGoal(
  userId: number,
  goalId: number,
  data: { name: string; target_amount: number; target_date?: string; account_id?: number; notes?: string; status?: "active" | "completed" | "cancelled" }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const updatePayload: Record<string, unknown> = {
    name: data.name.trim(),
    target_amount: data.target_amount,
    target_date: data.target_date || null,
    account_id: data.account_id || null,
    notes: data.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (data.status) updatePayload.status = data.status;

  const { error } = await supabase
    .from("savings_goals")
    .update(updatePayload)
    .eq("id", goalId)
    .eq("user_id", userId);

  return !error;
}

export async function deleteSavingsGoal(userId: number, goalId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  return !error;
}

export async function addSavingsContribution(
  userId: number,
  data: { goalId: number; accountId: number; amount: number; date: string; notes?: string }
): Promise<{ success: boolean; contributionId?: number; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!data.amount || data.amount <= 0) return { success: false, error: "Nominal harus > 0" };

  const { data: goal } = await supabase.from("savings_goals").select("*").eq("id", data.goalId).eq("user_id", userId).single();
  if (!goal) return { success: false, error: "Target tabungan tidak ditemukan." };

  const { data: acc } = await supabase.from("accounts").select("id").eq("id", data.accountId).eq("user_id", userId).single();
  if (!acc) return { success: false, error: "Akun sumber dana tidak valid." };

  const { data: inserted, error: cErr } = await supabase
    .from("savings_contributions")
    .insert({
      user_id: userId,
      goal_id: data.goalId,
      account_id: data.accountId,
      amount: data.amount,
      date: data.date,
      notes: data.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (cErr || !inserted) return { success: false, error: cErr?.message || "Gagal mencatat setoran" };

  const destAccountId = goal.account_id && Number(goal.account_id) !== Number(data.accountId) ? goal.account_id : null;
  if (destAccountId) {
    await supabase.from("transactions").insert({
      user_id: userId,
      type: "transfer",
      amount: data.amount,
      account_id: data.accountId,
      destination_account_id: destAccountId,
      name: `Setoran Tabungan: ${goal.name}`,
      notes: data.notes?.trim() || null,
      date: data.date,
    });
  }

  const { data: allContribs } = await supabase
    .from("savings_contributions")
    .select("amount")
    .eq("goal_id", data.goalId);

  const total = (allContribs || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
  if (total >= Number(goal.target_amount)) {
    await supabase.from("savings_goals").update({ status: "completed" }).eq("id", data.goalId);
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Target Tabungan Tercapai! 🎉",
      message: `Target "${goal.name}" sebesar Rp ${Math.round(Number(goal.target_amount)).toLocaleString("id-ID")} telah tercapai 100%!`,
      type: "success",
    });
  }

  return { success: true, contributionId: Number(inserted.id) };
}

export async function getSavingsContributions(userId: number, goalId?: number): Promise<SavingsContribution[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("savings_contributions")
    .select("*, goal:savings_goals(name), account:accounts(name)")
    .eq("user_id", userId);

  if (goalId) query = query.eq("goal_id", goalId);
  query = query.order("date", { ascending: false }).order("id", { ascending: false });

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((c: any) => ({
    id: Number(c.id),
    user_id: Number(c.user_id),
    goal_id: Number(c.goal_id),
    account_id: Number(c.account_id),
    amount: Number(c.amount),
    date: c.date,
    notes: c.notes,
    created_at: c.created_at,
    goal_name: c.goal?.name,
    account_name: c.account?.name,
  })) as SavingsContribution[];
}

export async function deleteSavingsContribution(userId: number, contributionId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("savings_contributions")
    .delete()
    .eq("id", contributionId)
    .eq("user_id", userId);

  return !error;
}

