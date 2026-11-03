import { getSupabaseAdmin } from "../supabase";
import { getSpendingBreakdown } from "./breakdown";
import { Transaction } from "../types";
import { getMonthBounds } from "../utils";

export async function getFinancialReport(userId: number, options: { startDate: string; endDate: string; categoryId?: number; accountId?: number }) {
  const supabase = getSupabaseAdmin();
  const { startDate, endDate, categoryId, accountId } = options;

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (accountId) query = query.or(`account_id.eq.${accountId},destination_account_id.eq.${accountId}`);

  query = query.order("date", { ascending: false }).order("id", { ascending: false });

  const { data: rows } = await query;
  const transactionsData = rows || [];

  let inc = 0;
  let exp = 0;
  for (const t of transactionsData) {
    if (t.type === "income") inc += Number(t.amount) || 0;
    if (t.type === "expense") exp += Number(t.amount) || 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  const { data: categories } = await supabase.from("categories").select("id, name, icon, color").eq("user_id", userId);
  const { data: accounts } = await supabase.from("accounts").select("id, name").eq("user_id", userId);
  const catMap = new Map((categories || []).map((c) => [Number(c.id), c]));
  const accMap = new Map((accounts || []).map((a) => [Number(a.id), a.name]));

  const transactions = transactionsData.map((t) => {
    const cat = t.category_id ? catMap.get(Number(t.category_id)) : null;
    return {
      ...t,
      id: Number(t.id),
      user_id: Number(t.user_id),
      amount: Number(t.amount),
      category_name: cat ? cat.name : undefined,
      category_icon: cat ? cat.icon : undefined,
      category_color: cat ? cat.color : undefined,
      account_name: accMap.get(Number(t.account_id)) || "Akun",
      destination_account_name: t.destination_account_id ? accMap.get(Number(t.destination_account_id)) : undefined,
    } as Transaction;
  });

  const categoryBreakdown = await getSpendingBreakdown(userId, startDate, endDate);

  return {
    startDate,
    endDate,
    totalIncome: inc,
    totalExpense: exp,
    netCashFlow: inc - exp,
    totalDays: days,
    avgDailyExpense: Math.round(exp / days),
    categoryBreakdown,
    transactions,
  };
}

export async function getFinancialInsights(userId: number) {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const curBounds = getMonthBounds(now.getFullYear(), now.getMonth() + 1);

  const lastMDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastBounds = getMonthBounds(lastMDate.getFullYear(), lastMDate.getMonth() + 1);

  const { data: curTxs } = await supabase
    .from("transactions")
    .select("amount, date, category_id, category:categories(name)")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", curBounds.start)
    .lt("date", curBounds.nextMonthStart);

  const { data: lastTxs } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", lastBounds.start)
    .lt("date", lastBounds.nextMonthStart);

  const curExp = (curTxs || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const lastExp = (lastTxs || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const diff = curExp - lastExp;
  const diffPercent = lastExp > 0 ? Math.round((diff / lastExp) * 100) : 0;

  // Top category
  const catTotals = new Map<string, number>();
  // Highest day
  const dayTotals = new Map<string, number>();

  for (const t of (curTxs || []) as any[]) {
    const amt = Number(t.amount) || 0;
    const cName = t.category?.name || "Lainnya";
    catTotals.set(cName, (catTotals.get(cName) || 0) + amt);
    if (t.date) dayTotals.set(t.date, (dayTotals.get(t.date) || 0) + amt);
  }

  let topCat: { name: string; total: number } | null = null;
  for (const [name, total] of catTotals.entries()) {
    if (!topCat || total > topCat.total) topCat = { name, total };
  }

  let highestDay: { date: string; total: number } | null = null;
  for (const [date, total] of dayTotals.entries()) {
    if (!highestDay || total > highestDay.total) highestDay = { date, total };
  }

  return {
    curExpense: curExp,
    lastExpense: lastExp,
    expenseDiff: diff,
    expenseDiffPercent: diffPercent,
    topCategory: topCat,
    highestDay: highestDay,
  };
}
