import { getSupabaseAdmin } from "../supabase";
import { Budget } from "../types";
import { getMonthBounds } from "../utils";

export async function getBudgets(userId: number, month?: number, year?: number): Promise<Budget[]> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  const bounds = getMonthBounds(targetYear, targetMonth);

  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, category:categories(name, icon, color)")
    .eq("user_id", userId)
    .eq("month", targetMonth)
    .eq("year", targetYear)
    .order("amount", { ascending: false });

  if (!budgets) return [];

  // Query expenses for this month to calculate spent & remaining
  const { data: txs } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", bounds.start)
    .lt("date", bounds.nextMonthStart);

  const expenseTxs = txs || [];
  const spentMap = new Map<number, number>();
  for (const t of expenseTxs) {
    if (t.category_id) {
      const cid = Number(t.category_id);
      spentMap.set(cid, (spentMap.get(cid) || 0) + (Number(t.amount) || 0));
    }
  }

  return budgets.map((b: any) => {
    const cid = Number(b.category_id);
    const spent = spentMap.get(cid) || 0;
    const amount = Number(b.amount);
    const remaining = amount - spent;
    const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;

    return {
      id: Number(b.id),
      user_id: Number(b.user_id),
      category_id: cid,
      month: Number(b.month),
      year: Number(b.year),
      amount,
      spent,
      remaining,
      percentage,
      category_name: b.category?.name || "Kategori",
      category_icon: b.category?.icon || "Tag",
      category_color: b.category?.color || "#2563EB",
      created_at: b.created_at,
      updated_at: b.updated_at,
    } as Budget;
  });
}

export async function setBudget(
  userId: number,
  data: { categoryId: number; month: number; year: number; amount: number }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: userId,
        category_id: data.categoryId,
        month: data.month,
        year: data.year,
        amount: data.amount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, category_id, month, year" }
    );

  return !error;
}

export async function deleteBudget(userId: number, budgetId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId);

  return !error;
}
