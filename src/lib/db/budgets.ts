import { getDatabase } from "./connection";
import { Budget } from "../types";

export function getBudgets(userId: number, month?: number, year?: number): Budget[] {
  const db = getDatabase();
  const now = new Date();
  const targetMonth = month || now.getMonth() + 1;
  const targetYear = year || now.getFullYear();
  const monthStr = String(targetMonth).padStart(2, "0");
  const prefix = `${targetYear}-${monthStr}`;

  const query = `
    SELECT 
      b.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.month = ? AND b.year = ?
    ORDER BY b.amount DESC
  `;

  const budgets = db.prepare(query).all(userId, targetMonth, targetYear) as unknown as Budget[];

  return budgets.map((b) => {
    const spentRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND category_id = ? AND type = 'expense' AND date LIKE ?`
      )
      .get(userId, b.category_id, `${prefix}%`) as { total: number };

    const spent = Number(spentRow.total);
    const remaining = Number(b.amount) - spent;
    const percentage = Math.round((spent / Number(b.amount)) * 100);

    return {
      ...b,
      spent,
      remaining,
      percentage,
    };
  });
}

export function setBudget(
  userId: number,
  data: { categoryId: number; month: number; year: number; amount: number }
): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO budgets (user_id, category_id, month, year, amount)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, category_id, month, year) DO UPDATE SET
      amount = excluded.amount,
      updated_at = datetime('now', 'localtime')
  `);
  const res = stmt.run(userId, data.categoryId, data.month, data.year, data.amount);
  return res.changes > 0;
}

export function deleteBudget(userId: number, budgetId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM budgets WHERE id = ? AND user_id = ?`);
  const res = stmt.run(budgetId, userId);
  return res.changes > 0;
}
