import { getSupabaseAdmin } from "../supabase";
import { Notification } from "../types";

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: false })
    .limit(25);

  if (!data) return [];
  return data.map((n) => ({
    id: Number(n.id),
    user_id: Number(n.user_id),
    title: n.title,
    message: n.message,
    type: n.type,
    is_read: Number(n.is_read),
    created_at: n.created_at,
  })) as Notification[];
}

export async function markNotificationAsRead(userId: number, notificationId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: 1 })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

export async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: 1 })
    .eq("user_id", userId);

  return !error;
}

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: "info" | "warning" | "danger" | "success" = "info"
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      is_read: 0,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message || "Gagal membuat notifikasi");
  return Number(inserted.id);
}
