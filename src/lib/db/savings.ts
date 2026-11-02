import { getDatabase } from "./connection";
import { SavingsGoal, SavingsContribution, Account } from "../types";

export function getSavingsGoals(userId: number): SavingsGoal[] {
  const db = getDatabase();
  const query = `
    SELECT g.*, a.name as account_name,
      COALESCE((SELECT SUM(amount) FROM savings_contributions WHERE goal_id = g.id), 0) as current_amount
    FROM savings_goals g
    LEFT JOIN accounts a ON g.account_id = a.id
    WHERE g.user_id = ?
    ORDER BY g.status ASC, g.id DESC
  `;
  const goals = db.prepare(query).all(userId) as unknown as SavingsGoal[];
  return goals.map((g) => {
    const cur = Number(g.current_amount || 0);
    const tgt = Number(g.target_amount || 1);
    return {
      ...g,
      current_amount: cur,
      percentage: tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) : 0,
      remaining: Math.max(0, tgt - cur),
    };
  });
}

export function createSavingsGoal(
  userId: number,
  data: { name: string; target_amount: number; target_date?: string; account_id?: number; notes?: string }
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO savings_goals (user_id, name, target_amount, target_date, account_id, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);
  const res = stmt.run(userId, data.name.trim(), data.target_amount, data.target_date || null, data.account_id || null, data.notes?.trim() || null);
  return Number(res.lastInsertRowid);
}

export function updateSavingsGoal(
  userId: number,
  goalId: number,
  data: { name: string; target_amount: number; target_date?: string; account_id?: number; notes?: string; status?: "active" | "completed" | "cancelled" }
): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE savings_goals SET
      name = ?, target_amount = ?, target_date = ?, account_id = ?, notes = ?, status = COALESCE(?, status), updated_at = datetime('now', 'localtime')
    WHERE id = ? AND user_id = ?
  `);
  const res = stmt.run(data.name.trim(), data.target_amount, data.target_date || null, data.account_id || null, data.notes?.trim() || null, data.status || null, goalId, userId);
  return res.changes > 0;
}

export function deleteSavingsGoal(userId: number, goalId: number): boolean {
  const db = getDatabase();
  return db.prepare(`DELETE FROM savings_goals WHERE id = ? AND user_id = ?`).run(goalId, userId).changes > 0;
}

export function addSavingsContribution(
  userId: number,
  data: { goalId: number; accountId: number; amount: number; date: string; notes?: string }
): { success: boolean; contributionId?: number; error?: string } {
  const db = getDatabase();
  if (!data.amount || data.amount <= 0) return { success: false, error: "Nominal harus > 0" };

  const goal = db.prepare(`SELECT * FROM savings_goals WHERE id = ? AND user_id = ?`).get(data.goalId, userId) as SavingsGoal | undefined;
  if (!goal) return { success: false, error: "Target tidak ditemukan." };

  const acc = db.prepare(`SELECT * FROM accounts WHERE id = ? AND user_id = ?`).get(data.accountId, userId) as Account | undefined;
  if (!acc) return { success: false, error: "Akun sumber tidak valid." };

  try {
    db.exec("BEGIN TRANSACTION;");
    const ins = db.prepare(`INSERT INTO savings_contributions (user_id, goal_id, account_id, amount, date, notes) VALUES (?, ?, ?, ?, ?, ?)`);
    const cRes = ins.run(userId, data.goalId, data.accountId, data.amount, data.date, data.notes?.trim() || null);
    const contributionId = Number(cRes.lastInsertRowid);

    const destAccountId = goal.account_id && goal.account_id !== data.accountId ? goal.account_id : null;
    if (destAccountId) {
      db.prepare(`INSERT INTO transactions (user_id, type, amount, account_id, destination_account_id, name, notes, date) VALUES (?, 'transfer', ?, ?, ?, ?, ?, ?)`).run(
        userId, data.amount, data.accountId, destAccountId, `Setoran Tabungan: ${goal.name}`, data.notes?.trim() || null, data.date
      );
    }
    db.exec("COMMIT;");

    const totalRow = db.prepare(`SELECT SUM(amount) as total FROM savings_contributions WHERE goal_id = ?`).get(data.goalId) as { total: number };
    if (Number(totalRow.total) >= goal.target_amount) {
      db.prepare(`UPDATE savings_goals SET status = 'completed' WHERE id = ?`).run(data.goalId);
    }
    return { success: true, contributionId };
  } catch (err: unknown) {
    db.exec("ROLLBACK;");
    return { success: false, error: (err as Error).message };
  }
}

export function getSavingsContributions(userId: number, goalId?: number): SavingsContribution[] {
  const db = getDatabase();
  let query = `
    SELECT sc.*, g.name as goal_name, a.name as account_name
    FROM savings_contributions sc
    JOIN savings_goals g ON sc.goal_id = g.id
    JOIN accounts a ON sc.account_id = a.id
    WHERE sc.user_id = ?
  `;
  const params: (number | string)[] = [userId];
  if (goalId) {
    query += " AND sc.goal_id = ?";
    params.push(goalId);
  }
  query += " ORDER BY sc.date DESC, sc.id DESC";
  return db.prepare(query).all(...params) as unknown as SavingsContribution[];
}

export function deleteSavingsContribution(userId: number, contributionId: number): boolean {
  const db = getDatabase();
  return db.prepare(`DELETE FROM savings_contributions WHERE id = ? AND user_id = ?`).run(contributionId, userId).changes > 0;
}
