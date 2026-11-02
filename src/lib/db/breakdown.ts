import { getDatabase } from "./connection";
import { SpendingByCategory } from "../types";

export function getSpendingBreakdown(userId: number, startDate?: string, endDate?: string): SpendingByCategory[] {
  const db = getDatabase();
  let dateClause = "";
  const params: (string | number)[] = [userId];

  if (startDate && endDate) {
    dateClause = "AND t.date >= ? AND t.date <= ?";
    params.push(startDate, endDate);
  } else {
    const now = new Date();
    dateClause = "AND t.date LIKE ?";
    params.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}%`);
  }

  const query = `
    SELECT c.id as categoryId, COALESCE(c.name, 'Lainnya') as categoryName, COALESCE(c.color, '#6B7280') as categoryColor,
      COALESCE(c.icon, 'CreditCard') as categoryIcon, SUM(t.amount) as totalAmount, COUNT(t.id) as count
    FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ? AND t.type = 'expense' ${dateClause}
    GROUP BY c.id ORDER BY totalAmount DESC
  `;
  const rows = db.prepare(query).all(...params) as Array<{
    categoryId: number; categoryName: string; categoryColor: string; categoryIcon: string; totalAmount: number; count: number;
  }>;
  const total = rows.reduce((s, r) => s + Number(r.totalAmount), 0);
  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    categoryColor: r.categoryColor,
    categoryIcon: r.categoryIcon,
    totalAmount: Number(r.totalAmount),
    count: Number(r.count),
    percentage: total > 0 ? Math.round((Number(r.totalAmount) / total) * 100) : 0,
  }));
}
