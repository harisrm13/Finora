import { getDatabase } from "./connection";
import { User } from "../types";

export function findUserByEmail(email: string): (User & { password_hash: string }) | null {
  const db = getDatabase();
  const user = db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.toLowerCase().trim()) as (User & { password_hash: string }) | undefined;
  return user || null;
}

export function findUserById(id: number): User | null {
  const db = getDatabase();
  const user = db
    .prepare(`SELECT id, email, full_name, currency, created_at, updated_at FROM users WHERE id = ?`)
    .get(id) as User | undefined;
  return user || null;
}

export function createUser(data: { email: string; password_hash: string; full_name: string }): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, currency)
    VALUES (?, ?, ?, 'IDR')
  `);
  const res = stmt.run(data.email.toLowerCase().trim(), data.password_hash, data.full_name.trim());
  return Number(res.lastInsertRowid);
}

export function updateUserPassword(userId: number, passwordHash: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);
  const res = stmt.run(passwordHash, userId);
  return res.changes > 0;
}

export function updateUserProfile(userId: number, data: { full_name: string; currency?: string }): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE users SET full_name = ?, currency = COALESCE(?, currency), updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `);
  const res = stmt.run(data.full_name.trim(), data.currency || null, userId);
  return res.changes > 0;
}
