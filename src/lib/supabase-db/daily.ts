import { getSupabaseAdmin } from "../supabase";
import { DailyLimit, Transaction } from "../types";

export async function getDailyLimit(userId: number): Promise<DailyLimit> {
  const supabase = getSupabaseAdmin();
  const { data: limit } = await supabase
    .from("daily_limits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (limit) {
    return {
      id: Number(limit.id),
      user_id: Number(limit.user_id),
      amount: Number(limit.amount),
      is_active: Number(limit.is_active),
      updated_at: limit.updated_at,
    };
  }

  // Insert default 100.000 if not yet set
  await supabase.from("daily_limits").insert({ user_id: userId, amount: 100000, is_active: 1 });
  return { id: 1, user_id: userId, amount: 100000, is_active: 1 };
}

export async function updateDailyLimit(userId: number, amount: number, isActive: boolean = true): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("daily_limits")
    .upsert(
      {
        user_id: userId,
        amount,
        is_active: isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return !error;
}

export async function getDailyExpenseStats(userId: number, dateStr?: string) {
  const supabase = getSupabaseAdmin();
  const targetDate = dateStr || new Date().toISOString().split("T")[0];

  const targetDateObj = new Date(targetDate);
  const yesterdayObj = new Date(targetDateObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split("T")[0];

  // 1. Spending today
  const { data: todayTxs } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("date", targetDate);

  const spentToday = (todayTxs || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // 2. Spending yesterday
  const { data: yestTxs } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("date", yesterdayStr);

  const spentYesterday = (yestTxs || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // 3. Largest expense today
  const { data: largestRows } = await supabase
    .from("transactions")
    .select("name, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .eq("date", targetDate)
    .order("amount", { ascending: false })
    .limit(1);

  const largestExpense = largestRows && largestRows.length > 0 ? {
    name: largestRows[0].name,
    amount: Number(largestRows[0].amount),
  } : null;

  // 4. Daily limit info
  const limitInfo = await getDailyLimit(userId);
  const limitAmount = limitInfo.is_active ? limitInfo.amount : 0;
  const remainingLimit = limitAmount > 0 ? limitAmount - spentToday : 0;
  const limitPercentage = limitAmount > 0 ? Math.min(100, Math.round((spentToday / limitAmount) * 100)) : 0;

  let status: "safe" | "warning" | "exceeded" = "safe";
  if (limitAmount > 0) {
    if (spentToday > limitAmount) status = "exceeded";
    else if (spentToday >= limitAmount * 0.8) status = "warning";
  }

  // 5. Past 7 days summary
  const last7Days: { date: string; dayName: string; amount: number }[] = [];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  let sum7Days = 0;

  const d7AgoObj = new Date(targetDateObj);
  d7AgoObj.setDate(d7AgoObj.getDate() - 6);
  const d7AgoStr = d7AgoObj.toISOString().split("T")[0];

  const { data: weekTxs } = await supabase
    .from("transactions")
    .select("date, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", d7AgoStr)
    .lte("date", targetDate);

  const weekMap = new Map<string, number>();
  for (const t of weekTxs || []) {
    weekMap.set(t.date, (weekMap.get(t.date) || 0) + (Number(t.amount) || 0));
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date(targetDateObj);
    d.setDate(targetDateObj.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    const amt = weekMap.get(dStr) || 0;
    sum7Days += amt;
    last7Days.push({
      date: dStr,
      dayName: dayNames[d.getDay()],
      amount: amt,
    });
  }

  const averageDaily = Math.round(sum7Days / 7);

  // 6. Transactions on selected date
  const { data: txRows } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("date", targetDate)
    .order("id", { ascending: false });

  const { data: categories } = await supabase.from("categories").select("id, name, icon, color").eq("user_id", userId);
  const { data: accounts } = await supabase.from("accounts").select("id, name").eq("user_id", userId);
  const catMap = new Map((categories || []).map((c) => [Number(c.id), c]));
  const accMap = new Map((accounts || []).map((a) => [Number(a.id), a.name]));

  const transactions = (txRows || []).map((t) => {
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
    } as Transaction;
  });

  return {
    targetDate,
    spentToday,
    spentYesterday,
    largestExpense,
    limitAmount,
    remainingLimit,
    limitPercentage,
    status,
    last7Days,
    averageDaily,
    transactions,
  };
}
