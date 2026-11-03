import { getSupabaseAdmin } from "../supabase";
import { User } from "../types";

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !data) return null;
  return data as User & { password_hash: string };
}

export async function findUserById(id: number): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, currency, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function createUser(data: { email: string; password_hash: string; full_name: string }): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      email: data.email.toLowerCase().trim(),
      password_hash: data.password_hash,
      full_name: data.full_name.trim(),
      currency: "IDR",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Gagal membuat user");
  }
  return Number(inserted.id);
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return !error;
}

export async function updateUserProfile(userId: number, data: { full_name: string; currency?: string }): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const updatePayload: Record<string, unknown> = {
    full_name: data.full_name.trim(),
    updated_at: new Date().toISOString(),
  };
  if (data.currency) updatePayload.currency = data.currency;

  const { error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", userId);

  return !error;
}

export async function seedUserData(userId: number): Promise<void> {
  const supabase = getSupabaseAdmin();

  // 1. Default Accounts
  await supabase.from("accounts").insert([
    { user_id: userId, name: "Dompet Tunai", type: "cash", initial_balance: 0, color: "#16A34A" },
    { user_id: userId, name: "Rekening Bank BCA", type: "bank", initial_balance: 0, color: "#2563EB" },
    { user_id: userId, name: "E-Wallet (GoPay/DANA)", type: "ewallet", initial_balance: 0, color: "#0EA5E9" },
    { user_id: userId, name: "Rekening Tabungan", type: "savings", initial_balance: 0, color: "#8B5CF6" },
  ]);

  // 2. Default Income Categories
  const incomeCategories = [
    { name: "Uang Saku", icon: "Wallet", color: "#16A34A" },
    { name: "Gaji", icon: "Briefcase", color: "#2563EB" },
    { name: "Freelance", icon: "Laptop", color: "#8B5CF6" },
    { name: "Bisnis", icon: "Store", color: "#0D9488" },
    { name: "Bonus", icon: "Award", color: "#F59E0B" },
    { name: "Hadiah", icon: "Gift", color: "#EC4899" },
    { name: "Beasiswa", icon: "GraduationCap", color: "#3B82F6" },
    { name: "Pemasukan Lainnya", icon: "PlusCircle", color: "#6B7280" },
  ];

  await supabase.from("categories").insert(
    incomeCategories.map((c) => ({
      user_id: userId,
      name: c.name,
      type: "income",
      icon: c.icon,
      color: c.color,
      is_default: 1,
    }))
  );

  // 3. Default Expense Categories
  const expenseCategories = [
    { name: "Makanan & Minuman", icon: "Utensils", color: "#EF4444" },
    { name: "Transportasi", icon: "Car", color: "#F97316" },
    { name: "Pendidikan", icon: "BookOpen", color: "#3B82F6" },
    { name: "Belanja", icon: "ShoppingBag", color: "#EC4899" },
    { name: "Tagihan", icon: "Receipt", color: "#8B5CF6" },
    { name: "Pulsa & Internet", icon: "Wifi", color: "#06B6D4" },
    { name: "Kesehatan", icon: "HeartPulse", color: "#10B981" },
    { name: "Hiburan", icon: "Film", color: "#A855F7" },
    { name: "Kebutuhan Pribadi", icon: "UserCheck", color: "#F59E0B" },
    { name: "Kebutuhan Rumah", icon: "Home", color: "#64748B" },
    { name: "Pengeluaran Lainnya", icon: "CreditCard", color: "#6B7280" },
  ];

  await supabase.from("categories").insert(
    expenseCategories.map((c) => ({
      user_id: userId,
      name: c.name,
      type: "expense",
      icon: c.icon,
      color: c.color,
      is_default: 1,
    }))
  );

  // 4. Default Daily Limit
  await supabase.from("daily_limits").insert({
    user_id: userId,
    amount: 100000,
    is_active: 1,
  });

  // 5. Welcome Notification
  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Selamat Datang di Finora!",
    message: "Kelola keuangan pribadi, uang saku harian, anggaran bulanan, dan tabungan Anda dengan rapi dan aman.",
    type: "info",
    is_read: 0,
  });
}
