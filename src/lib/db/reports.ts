import { getDatabase } from "./connection";
import { getSpendingBreakdown } from "./breakdown";
import { Transaction } from "../types";

export function getFinancialReport(userId: number, options: { startDate: string; endDate: string; categoryId?: number; accountId?: number }) {
  const db = getDatabase();
  const { startDate, endDate, categoryId, accountId } = options;

  const where = ["user_id = ?", "date >= ?", "date <= ?"];
  const params: (string | number)[] = [userId, startDate, endDate];

  if (categoryId) {
    where.push("category_id = ?");
    params.push(categoryId);
  }
  if (accountId) {
    where.push("(account_id = ? OR destination_account_id = ?)");
    params.push(accountId, accountId);
  }

  const whereSql = where.join(" AND ");

  const inc = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE ${whereSql} AND type = 'income'`).get(...params) as { total: number }).total);
  const exp = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE ${whereSql} AND type = 'expense'`).get(...params) as { total: number }).total);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  const txQuery = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name, dest.name as destination_account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN accounts dest ON t.destination_account_id = dest.id
    WHERE ${whereSql}
    ORDER BY t.date DESC, t.id DESC
  `;
  const transactions = db.prepare(txQuery).all(...params) as unknown as Transaction[];

  return {
    startDate,
    endDate,
    totalIncome: inc,
    totalExpense: exp,
    netCashFlow: inc - exp,
    totalDays: days,
    avgDailyExpense: Math.round(exp / days),
    categoryBreakdown: getSpendingBreakdown(userId, startDate, endDate),
    transactions,
  };
}

export function getFinancialInsights(userId: number) {
  const db = getDatabase();
  const now = new Date();
  const curPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastPrefix = `${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, "0")}`;

  const curExp = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?`).get(userId, `${curPrefix}%`) as { t: number }).t);
  const lastExp = Number((db.prepare(`SELECT COALESCE(SUM(amount), 0) as t FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?`).get(userId, `${lastPrefix}%`) as { t: number }).t);

  const diff = curExp - lastExp;
  const diffPercent = lastExp > 0 ? Math.round((diff / lastExp) * 100) : 0;

  const topCat = db.prepare(`
    SELECT c.name, SUM(t.amount) as total
    FROM transactions t JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' AND t.date LIKE ?
    GROUP BY c.id ORDER BY total DESC LIMIT 1
  `).get(userId, `${curPrefix}%`) as { name: string; total: number } | undefined;

  const highestDay = db.prepare(`
    SELECT date, SUM(amount) as total
    FROM transactions WHERE user_id = ? AND type = 'expense' AND date LIKE ?
    GROUP BY date ORDER BY total DESC LIMIT 1
  `).get(userId, `${curPrefix}%`) as { date: string; total: number } | undefined;

  return {
    curExpense: curExp,
    lastExpense: lastExp,
    expenseDiff: diff,
    expenseDiffPercent: diffPercent,
    topCategory: topCat || null,
    highestDay: highestDay || null,
  };
}
