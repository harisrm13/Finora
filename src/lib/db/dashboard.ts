import { getDatabase } from "./connection";
import { getUserAccounts } from "./accounts";
import { DashboardSummary, CashFlowDataPoint } from "../types";

export function getDashboardSummary(userId: number): DashboardSummary {
  const db = getDatabase();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const monthPrefix = `${y}-${m}`;

  const lastM = new Date(y, now.getMonth() - 1, 1);
  const lastMPrefix = `${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, "0")}`;

  const accounts = getUserAccounts(userId);
  const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

  const inc = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM transactions WHERE user_id = ? AND type = 'income' AND date LIKE ?`).get(userId, `${monthPrefix}%`) as { t: number }).t);
  const exp = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?`).get(userId, `${monthPrefix}%`) as { t: number }).t);

  const lastInc = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM transactions WHERE user_id = ? AND type = 'income' AND date LIKE ?`).get(userId, `${lastMPrefix}%`) as { t: number }).t);
  const lastExp = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?`).get(userId, `${lastMPrefix}%`) as { t: number }).t);

  const sav = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM savings_contributions WHERE user_id = ?`).get(userId) as { t: number }).t);

  return {
    totalBalance,
    thisMonthIncome: inc,
    thisMonthExpense: exp,
    totalSavings: sav,
    netCashFlow: inc - exp,
    lastMonthIncome: lastInc,
    lastMonthExpense: lastExp,
    incomeChangePercentage: lastInc > 0 ? Math.round(((inc - lastInc) / lastInc) * 100) : 0,
    expenseChangePercentage: lastExp > 0 ? Math.round(((exp - lastExp) / lastExp) * 100) : 0,
  };
}

export function getCashFlowChartData(
  userId: number,
  period: "7days" | "month" | "3months" | "6months" | "1year" = "month"
): CashFlowDataPoint[] {
  const db = getDatabase();
  const results: CashFlowDataPoint[] = [];
  const now = new Date();

  if (period === "7days") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const row = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as inc, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as exp FROM transactions WHERE user_id = ? AND date = ?`).get(userId, dStr) as { inc: number; exp: number };
      results.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, income: Number(row.inc), expense: Number(row.exp), net: Number(row.inc) - Number(row.exp) });
    }
  } else if (period === "month") {
    const curY = now.getFullYear();
    const curM = now.getMonth();
    const days = new Date(curY, curM + 1, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const dStr = `${curY}-${String(curM + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const row = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as inc, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as exp FROM transactions WHERE user_id = ? AND date = ?`).get(userId, dStr) as { inc: number; exp: number };
      results.push({ label: `${day}`, income: Number(row.inc), expense: Number(row.exp), net: Number(row.inc) - Number(row.exp) });
    }
  } else {
    const count = period === "3months" ? 3 : period === "6months" ? 6 : 12;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const row = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as inc, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as exp FROM transactions WHERE user_id = ? AND date LIKE ?`).get(userId, `${prefix}%`) as { inc: number; exp: number };
      results.push({ label: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`, income: Number(row.inc), expense: Number(row.exp), net: Number(row.inc) - Number(row.exp) });
    }
  }
  return results;
}
