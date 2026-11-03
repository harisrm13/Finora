import { getSupabaseAdmin } from "../supabase";
import { Category } from "../types";

export async function getUserCategories(userId: number, type?: "income" | "expense"): Promise<Category[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId);

  if (type) {
    query = query.eq("type", type).order("name", { ascending: true });
  } else {
    query = query.order("type", { ascending: false }).order("name", { ascending: true });
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((c) => ({
    ...c,
    id: Number(c.id),
    user_id: Number(c.user_id),
  })) as Category[];
}

export async function createCategory(
  userId: number,
  data: { name: string; type: "income" | "expense"; icon?: string; color?: string }
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: data.name.trim(),
      type: data.type,
      icon: data.icon || "Tag",
      color: data.color || (data.type === "income" ? "#16A34A" : "#DC2626"),
      is_default: 0,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message || "Gagal membuat kategori");
  return Number(inserted.id);
}

export async function updateCategory(
  userId: number,
  categoryId: number,
  data: { name: string; icon?: string; color?: string }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const updatePayload: Record<string, unknown> = {
    name: data.name.trim(),
    updated_at: new Date().toISOString(),
  };
  if (data.icon) updatePayload.icon = data.icon;
  if (data.color) updatePayload.color = data.color;

  const { error } = await supabase
    .from("categories")
    .update(updatePayload)
    .eq("id", categoryId)
    .eq("user_id", userId);

  return !error;
}

export async function deleteCategory(userId: number, categoryId: number): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();

  // Check if category exists
  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .single();

  if (!cat) return { success: false, error: "Kategori tidak ditemukan." };

  // Check if transactions exist using this category
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("user_id", userId);

  if (count && count > 0) {
    return {
      success: false,
      error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${count} transaksi.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);

  return { success: !error };
}
