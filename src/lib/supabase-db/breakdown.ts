import { getSupabaseAdmin } from "../supabase";
import { SpendingByCategory } from "../types";
import { getMonthBounds } from "../utils";

export async function getSpendingBreakdown(userId: number, startDate?: string, endDate?: string): Promise<SpendingByCategory[]> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const bounds = getMonthBounds(now.getFullYear(), now.getMonth() + 1);

  let query = supabase
    .from("transactions")
    .select("amount, category_id, category:categories(name, color, icon)")
    .eq("user_id", userId)
    .eq("type", "expense");

  if (startDate && endDate) {
    query = query.gte("date", startDate).lte("date", endDate);
  } else {
    query = query.gte("date", bounds.start).lt("date", bounds.nextMonthStart);
  }

  const { data: rows } = await query;
  if (!rows || rows.length === 0) return [];

  const catMap = new Map<number, { name: string; color: string; icon: string; total: number; count: number }>();
  let grandTotal = 0;

  for (const r of rows as any[]) {
    const amt = Number(r.amount) || 0;
    const cid = Number(r.category_id) || 0;
    grandTotal += amt;

    const existing = catMap.get(cid) || {
      name: r.category?.name || "Lainnya",
      color: r.category?.color || "#6B7280",
      icon: r.category?.icon || "CreditCard",
      total: 0,
      count: 0,
    };
    existing.total += amt;
    existing.count += 1;
    catMap.set(cid, existing);
  }

  const results: SpendingByCategory[] = [];
  for (const [cid, val] of catMap.entries()) {
    results.push({
      categoryId: cid,
      categoryName: val.name,
      categoryColor: val.color,
      categoryIcon: val.icon,
      totalAmount: val.total,
      count: val.count,
      percentage: grandTotal > 0 ? Math.round((val.total / grandTotal) * 100) : 0,
    });
  }

  return results.sort((a, b) => b.totalAmount - a.totalAmount);
}
