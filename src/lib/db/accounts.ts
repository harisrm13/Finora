import { getDatabase } from "./connection";
import { Account } from "../types";

export function getUserAccounts(userId: number): Account[] {
  const db = getDatabase();
  const accounts = db
    .prepare(
      `SELECT * FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY id ASC`
    )
    .all(userId) as unknown as Account[];

  return accounts.map((acc) => {
    // Current balance calculation
    const incomeRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND account_id = ? AND type = 'income'`
      )
      .get(userId, acc.id) as { total: number };

    const expenseRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND account_id = ? AND type = 'expense'`
      )
      .get(userId, acc.id) as { total: number };

    const transferInRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND destination_account_id = ? AND type = 'transfer'`
      )
      .get(userId, acc.id) as { total: number };

    const transferOutRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND account_id = ? AND type = 'transfer'`
      )
      .get(userId, acc.id) as { total: number };

    const current_balance =
      Number(acc.initial_balance) +
      Number(incomeRow.total) -
      Number(expenseRow.total) +
      Number(transferInRow.total) -
      Number(transferOutRow.total);

    return {
      ...acc,
      current_balance,
    };
  });
}

export function createAccount(
  userId: number,
  data: { name: string; type: string; initial_balance: number; color?: string }
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO accounts (user_id, name, type, initial_balance, color)
    VALUES (?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    userId,
    data.name.trim(),
    data.type,
    data.initial_balance || 0,
    data.color || "#2563EB"
  );
  return Number(res.lastInsertRowid);
}

export function updateAccount(
  userId: number,
  accountId: number,
  data: { name: string; type: string; initial_balance: number; color?: string }
): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE accounts 
    SET name = ?, type = ?, initial_balance = ?, color = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ? AND user_id = ?
  `);
  const res = stmt.run(
    data.name.trim(),
    data.type,
    data.initial_balance || 0,
    data.color || "#2563EB",
    accountId,
    userId
  );
  return res.changes > 0;
}

export function deleteAccount(userId: number, accountId: number): boolean {
  const db = getDatabase();
  const txCount = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM transactions WHERE user_id = ? AND (account_id = ? OR destination_account_id = ?)`
    )
    .get(userId, accountId, accountId) as { cnt: number };

  if (txCount.cnt > 0) {
    const stmt = db.prepare(`
      UPDATE accounts SET is_active = 0, updated_at = datetime('now', 'localtime')
      WHERE id = ? AND user_id = ?
    `);
    const res = stmt.run(accountId, userId);
    return res.changes > 0;
  } else {
    const stmt = db.prepare(`DELETE FROM accounts WHERE id = ? AND user_id = ?`);
    const res = stmt.run(accountId, userId);
    return res.changes > 0;
  }
}
