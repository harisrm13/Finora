import { getDatabase } from "./connection";
import { Notification } from "../types";

export function getUserNotifications(userId: number): Notification[] {
  const db = getDatabase();
  return db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 25`)
    .all(userId) as unknown as Notification[];
}

export function markNotificationAsRead(userId: number, notificationId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`);
  const res = stmt.run(notificationId, userId);
  return res.changes > 0;
}

export function markAllNotificationsAsRead(userId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`);
  const res = stmt.run(userId);
  return res.changes > 0;
}

export function createNotification(
  userId: number,
  title: string,
  message: string,
  type: "info" | "warning" | "danger" | "success" = "info"
): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, ?)
  `);
  const res = stmt.run(userId, title, message, type);
  return Number(res.lastInsertRowid);
}
