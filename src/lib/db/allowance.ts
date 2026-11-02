import { getDatabase } from "./connection";
import { AllowancePlan } from "../types";

export function getAllowancePlans(userId: number): AllowancePlan[] {
  const db = getDatabase();
  const plans = db
    .prepare(`SELECT * FROM allowance_plans WHERE user_id = ? ORDER BY id DESC`)
    .all(userId) as unknown as AllowancePlan[];

  return plans.map((p) => {
    const spentRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense' AND date >= ? AND date <= ?`
      )
      .get(userId, p.start_date, p.end_date) as { total: number };

    const incomeRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income' AND date >= ? AND date <= ?`
      )
      .get(userId, p.start_date, p.end_date) as { total: number };

    const spent = Number(spentRow.total);
    const received = Number(incomeRow.total);
    const remaining = Number(p.spending_limit) - spent;

    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    const now = new Date();
    const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    const daysPassed = Math.max(0, Math.round((now.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const daysRemaining = Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 3600 * 24)));
    const avgDailySpent = daysPassed > 0 ? Math.round(spent / Math.min(daysTotal, daysPassed)) : spent;

    return {
      ...p,
      spent_amount: spent,
      received_amount: received,
      remaining_spending: remaining,
      days_total: daysTotal,
      days_remaining: daysRemaining,
      avg_daily_spent: avgDailySpent,
    };
  });
}

export function createAllowancePlan(
  userId: number,
  data: {
    name: string;
    period_type: "daily" | "weekly" | "monthly";
    start_date: string;
    end_date: string;
    target_amount: number;
    spending_limit: number;
    savings_target: number;
    notes?: string;
  }
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO allowance_plans (
      user_id, name, period_type, start_date, end_date, target_amount, spending_limit, savings_target, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    userId,
    data.name.trim(),
    data.period_type,
    data.start_date,
    data.end_date,
    data.target_amount,
    data.spending_limit,
    data.savings_target || 0,
    data.notes?.trim() || null
  );
  return Number(res.lastInsertRowid);
}

export function deleteAllowancePlan(userId: number, planId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM allowance_plans WHERE id = ? AND user_id = ?`);
  const res = stmt.run(planId, userId);
  return res.changes > 0;
}
