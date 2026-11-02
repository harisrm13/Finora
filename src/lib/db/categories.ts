import { getDatabase } from "./connection";
import { Category } from "../types";

export function getUserCategories(userId: number, type?: "income" | "expense"): Category[] {
  const db = getDatabase();
  if (type) {
    return db
      .prepare(
        `SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY name ASC`
      )
      .all(userId, type) as unknown as Category[];
  }
  return db
    .prepare(`SELECT * FROM categories WHERE user_id = ? ORDER BY type DESC, name ASC`)
    .all(userId) as unknown as Category[];
}

export function createCategory(
  userId: number,
  data: { name: string; type: "income" | "expense"; icon?: string; color?: string }
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO categories (user_id, name, type, icon, color, is_default)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  const res = stmt.run(
    userId,
    data.name.trim(),
    data.type,
    data.icon || "Tag",
    data.color || (data.type === "income" ? "#16A34A" : "#DC2626")
  );
  return Number(res.lastInsertRowid);
}

export function updateCategory(
  userId: number,
  categoryId: number,
  data: { name: string; icon?: string; color?: string }
): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE categories 
    SET name = ?, icon = COALESCE(?, icon), color = COALESCE(?, color), updated_at = datetime('now', 'localtime')
    WHERE id = ? AND user_id = ?
  `);
  const res = stmt.run(data.name.trim(), data.icon || null, data.color || null, categoryId, userId);
  return res.changes > 0;
}

export function deleteCategory(userId: number, categoryId: number): { success: boolean; error?: string } {
  const db = getDatabase();
  const cat = db
    .prepare(`SELECT * FROM categories WHERE id = ? AND user_id = ?`)
    .get(categoryId, userId) as Category | undefined;

  if (!cat) return { success: false, error: "Kategori tidak ditemukan." };

  const txCount = db
    .prepare(`SELECT COUNT(*) as cnt FROM transactions WHERE category_id = ? AND user_id = ?`)
    .get(categoryId, userId) as { cnt: number };

  if (txCount.cnt > 0) {
    return {
      success: false,
      error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${txCount.cnt} transaksi.`,
    };
  }

  const stmt = db.prepare(`DELETE FROM categories WHERE id = ? AND user_id = ?`);
  const res = stmt.run(categoryId, userId);
  return { success: res.changes > 0 };
}
