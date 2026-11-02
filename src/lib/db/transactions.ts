import { getDatabase } from "./connection";
import { Transaction } from "../types";

export interface GetTxOptions {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: number;
  accountId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  sort?: "desc" | "asc";
}

export function getTransactions(
  userId: number,
  options?: GetTxOptions
): { transactions: Transaction[]; total: number; totalPages: number } {
  const db = getDatabase();
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, Math.min(100, options?.limit || 15));
  const offset = (page - 1) * limit;

  const where = ["t.user_id = ?"];
  const params: (string | number)[] = [userId];

  if (options?.type && ["income", "expense", "transfer"].includes(options.type)) {
    where.push("t.type = ?");
    params.push(options.type);
  }
  if (options?.categoryId) {
    where.push("t.category_id = ?");
    params.push(options.categoryId);
  }
  if (options?.accountId) {
    where.push("(t.account_id = ? OR t.destination_account_id = ?)");
    params.push(options.accountId, options.accountId);
  }
  if (options?.startDate) {
    where.push("t.date >= ?");
    params.push(options.startDate);
  }
  if (options?.endDate) {
    where.push("t.date <= ?");
    params.push(options.endDate);
  }
  if (options?.search && options.search.trim()) {
    where.push("(t.name LIKE ? OR t.notes LIKE ?)");
    params.push(`%${options.search.trim()}%`, `%${options.search.trim()}%`);
  }

  const whereSql = where.join(" AND ");
  const sort = options?.sort === "asc" ? "ASC" : "DESC";

  const countRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM transactions t WHERE ${whereSql}`)
    .get(...params) as { cnt: number };

  const total = countRow.cnt;
  const totalPages = Math.ceil(total / limit);

  const query = `
    SELECT 
      t.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      a.name as account_name,
      dest.name as destination_account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN accounts dest ON t.destination_account_id = dest.id
    WHERE ${whereSql}
    ORDER BY t.date ${sort}, t.id ${sort}
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(query).all(...params, limit, offset) as unknown as Transaction[];

  return { transactions: rows, total, totalPages };
}

export function getTransactionById(userId: number, txId: number): Transaction | null {
  const db = getDatabase();
  const query = `
    SELECT 
      t.*,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      a.name as account_name,
      dest.name as destination_account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN accounts dest ON t.destination_account_id = dest.id
    WHERE t.id = ? AND t.user_id = ?
  `;
  const row = db.prepare(query).get(txId, userId) as unknown as Transaction | undefined;
  return row || null;
}

export function createTransaction(
  userId: number,
  data: {
    type: "income" | "expense" | "transfer";
    amount: number;
    categoryId?: number | null;
    accountId: number;
    destinationAccountId?: number | null;
    name: string;
    notes?: string | null;
    date: string;
  }
): { success: boolean; transactionId?: number; error?: string } {
  const db = getDatabase();
  if (!data.name || !data.name.trim()) return { success: false, error: "Nama transaksi wajib diisi." };
  if (!data.amount || data.amount <= 0) return { success: false, error: "Nominal harus lebih dari 0." };

  if (data.type === "transfer") {
    if (!data.destinationAccountId) return { success: false, error: "Akun tujuan transfer wajib dipilih." };
    if (data.accountId === data.destinationAccountId) return { success: false, error: "Akun sumber dan tujuan tidak boleh sama." };
  }

  const stmt = db.prepare(`
    INSERT INTO transactions (
      user_id, type, amount, category_id, account_id, destination_account_id, name, notes, date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = stmt.run(
    userId,
    data.type,
    data.amount,
    data.type === "transfer" ? null : data.categoryId || null,
    data.accountId,
    data.type === "transfer" ? data.destinationAccountId || null : null,
    data.name.trim(),
    data.notes?.trim() || null,
    data.date
  );

  return { success: true, transactionId: Number(res.lastInsertRowid) };
}

export function updateTransaction(
  userId: number,
  txId: number,
  data: {
    type: "income" | "expense" | "transfer";
    amount: number;
    categoryId?: number | null;
    accountId: number;
    destinationAccountId?: number | null;
    name: string;
    notes?: string | null;
    date: string;
  }
): { success: boolean; error?: string } {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE transactions SET
      type = ?,
      amount = ?,
      category_id = ?,
      account_id = ?,
      destination_account_id = ?,
      name = ?,
      notes = ?,
      date = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ? AND user_id = ?
  `);

  const res = stmt.run(
    data.type,
    data.amount,
    data.type === "transfer" ? null : data.categoryId || null,
    data.accountId,
    data.type === "transfer" ? data.destinationAccountId || null : null,
    data.name.trim(),
    data.notes?.trim() || null,
    data.date,
    txId,
    userId
  );

  return { success: res.changes > 0 };
}

export function deleteTransaction(userId: number, txId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM transactions WHERE id = ? AND user_id = ?`);
  const res = stmt.run(txId, userId);
  return res.changes > 0;
}
