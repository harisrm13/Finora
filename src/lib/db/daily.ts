import { getDatabase } from "./connection";
import { DailyLimit, Transaction } from "../types";

export function getDailyLimit(userId: number): DailyLimit {
  const db = getDatabase();
  const limit = db
    .prepare(`SELECT * FROM daily_limits WHERE user_id = ?`)
    .get(userId) as DailyLimit | undefined;

  if (limit) return limit;

  db.prepare(`INSERT INTO daily_limits (user_id, amount, is_active) VALUES (?, 100000, 1)`).run(userId);
  return { id: 1, user_id: userId, amount: 100000, is_active: 1 };
}

export function updateDailyLimit(userId: number, amount: number, isActive: boolean = true): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO daily_limits (user_id, amount, is_active, updated_at)
    VALUES (?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(user_id) DO UPDATE SET
      amount = excluded.amount,
      is_active = excluded.is_active,
      updated_at = datetime('now', 'localtime')
  `);
  const res = stmt.run(userId, amount, isActive ? 1 : 0);
  return res.changes > 0;
}

export function getDailyExpenseStats(userId: number, dateStr?: string) {
  const db = getDatabase();
  const targetDate = dateStr || new Date().toISOString().split("T")[0];

  const targetDateObj = new Date(targetDate);
  const yesterdayObj = new Date(targetDateObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split("T")[0];

  const todayRow = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date = ?`
    )
    .get(userId, targetDate) as { total: number };
  const spentToday = Number(todayRow.total);

  const yesterdayRow = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date = ?`
    )
    .get(userId, yesterdayStr) as { total: number };
  const spentYesterday = Number(yesterdayRow.total);

  const largestTx = db
    .prepare(
      `SELECT name, amount FROM transactions WHERE user_id = ? AND type = 'expense' AND date = ? ORDER BY amount DESC LIMIT 1`
    )
    .get(userId, targetDate) as { name: string; amount: number } | undefined;

  const limitInfo = getDailyLimit(userId);
  const limitAmount = limitInfo.is_active ? limitInfo.amount : 0;
  const remainingLimit = limitAmount > 0 ? limitAmount - spentToday : 0;
  const limitPercentage = limitAmount > 0 ? Math.min(100, Math.round((spentToday / limitAmount) * 100)) : 0;

  let status: "safe" | "warning" | "exceeded" = "safe";
  if (limitAmount > 0) {
    if (spentToday > limitAmount) status = "exceeded";
    else if (spentToday >= limitAmount * 0.8) status = "warning";
  }

  const last7Days: { date: string; dayName: string; amount: number }[] = [];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  let sum7Days = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(targetDateObj);
    d.setDate(targetDateObj.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    const r = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date = ?`
      )
      .get(userId, dStr) as { total: number };
    const amt = Number(r.total);
    sum7Days += amt;
    last7Days.push({
      date: dStr,
      dayName: dayNames[d.getDay()],
      amount: amt,
    });
  }

  const averageDaily = Math.round(sum7Days / 7);

  const transactions = db
    .prepare(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ? AND t.date = ?
      ORDER BY t.id DESC`
    )
    .all(userId, targetDate) as unknown as Transaction[];

  return {
    targetDate,
    spentToday,
    spentYesterday,
    largestExpense: largestTx || null,
    limitAmount,
    remainingLimit,
    limitPercentage,
    status,
    last7Days,
    averageDaily,
    transactions,
  };
}
