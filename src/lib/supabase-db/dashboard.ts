import { getSupabaseAdmin } from "../supabase";
import { getUserAccounts } from "./accounts";
import { DashboardSummary, CashFlowDataPoint } from "../types";
import { getMonthBounds } from "../utils";

export async function getDashboardSummary(userId: number): Promise<DashboardSummary> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.getMonth() + 1;

  const currentBounds = getMonthBounds(currentY, currentM);

  const lastMDate = new Date(currentY, now.getMonth() - 1, 1);
  const lastY = lastMDate.getFullYear();
  const lastM = lastMDate.getMonth() + 1;
  const lastBounds = getMonthBounds(lastY, lastM);

  const accounts = await getUserAccounts(userId);
  const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

  // Incomes & expenses this month and last month
  const { data: thisMonthTxs } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("date", currentBounds.start)
    .lt("date", currentBounds.nextMonthStart);

  let thisMonthIncome = 0;
  let thisMonthExpense = 0;
  for (const t of thisMonthTxs || []) {
    if (t.type === "income") thisMonthIncome += Number(t.amount) || 0;
    if (t.type === "expense") thisMonthExpense += Number(t.amount) || 0;
  }

  const { data: lastMonthTxs } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("date", lastBounds.start)
    .lt("date", lastBounds.nextMonthStart);

  let lastMonthIncome = 0;
  let lastMonthExpense = 0;
  for (const t of lastMonthTxs || []) {
    if (t.type === "income") lastMonthIncome += Number(t.amount) || 0;
    if (t.type === "expense") lastMonthExpense += Number(t.amount) || 0;
  }

  const { data: savRows } = await supabase
    .from("savings_contributions")
    .select("amount")
    .eq("user_id", userId);

  const totalSavings = (savRows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const incChange = lastMonthIncome > 0 ? Math.round(((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100) : 0;
  const expChange = lastMonthExpense > 0 ? Math.round(((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100) : 0;

  return {
    totalBalance,
    thisMonthIncome,
    thisMonthExpense,
    totalSavings,
    netCashFlow: thisMonthIncome - thisMonthExpense,
    lastMonthIncome,
    lastMonthExpense,
    incomeChangePercentage: incChange,
    expenseChangePercentage: expChange,
  };
}

export async function getCashFlowChartData(
  userId: number,
  period: "7days" | "month" | "3months" | "6months" | "1year" = "month"
): Promise<CashFlowDataPoint[]> {
  const supabase = getSupabaseAdmin();
  const results: CashFlowDataPoint[] = [];
  const now = new Date();

  // Fetch all user transactions in the maximum period to compute in memory for lightning speed
  let earliestDate = new Date();
  if (period === "7days") earliestDate.setDate(now.getDate() - 7);
  else if (period === "month") earliestDate.setDate(1);
  else if (period === "3months") earliestDate.setMonth(now.getMonth() - 3);
  else if (period === "6months") earliestDate.setMonth(now.getMonth() - 6);
  else earliestDate.setFullYear(now.getFullYear() - 1);

  const earliestStr = earliestDate.toISOString().split("T")[0];

  const { data: txs } = await supabase
    .from("transactions")
    .select("type, amount, date")
    .eq("user_id", userId)
    .gte("date", earliestStr);

  const transactions = txs || [];

  if (period === "7days") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      let inc = 0;
      let exp = 0;
      for (const t of transactions) {
        if (t.date === dStr) {
          if (t.type === "income") inc += Number(t.amount) || 0;
          if (t.type === "expense") exp += Number(t.amount) || 0;
        }
      }
      results.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, income: inc, expense: exp, net: inc - exp });
    }
  } else if (period === "month") {
    const curY = now.getFullYear();
    const curM = now.getMonth();
    const days = new Date(curY, curM + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const dStr = `${curY}-${String(curM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      let inc = 0;
      let exp = 0;
      for (const t of transactions) {
        if (t.date === dStr) {
          if (t.type === "income") inc += Number(t.amount) || 0;
          if (t.type === "expense") exp += Number(t.amount) || 0;
        }
      }
      results.push({ label: `${day}`, income: inc, expense: exp, net: inc - exp });
    }
  } else {
    const count = period === "3months" ? 3 : period === "6months" ? 6 : 12;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let inc = 0;
      let exp = 0;
      for (const t of transactions) {
        if (t.date && t.date.startsWith(prefix)) {
          if (t.type === "income") inc += Number(t.amount) || 0;
          if (t.type === "expense") exp += Number(t.amount) || 0;
        }
      }
      results.push({ label: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`, income: inc, expense: exp, net: inc - exp });
    }
  }
  return results;
}
