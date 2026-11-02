import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { SCHEMA_SQL } from "./schema";

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "finora.db");
  const db = new DatabaseSync(dbPath);

  // Set WAL mode and enable Foreign Key constraints
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Create tables & indexes
  db.exec(SCHEMA_SQL);

  dbInstance = db;
  return dbInstance;
}

export function seedUserData(userId: number) {
  const db = getDatabase();

  // 1. Default Accounts
  const insertAccount = db.prepare(`
    INSERT INTO accounts (user_id, name, type, initial_balance, color)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAccount.run(userId, "Dompet Tunai", "cash", 0, "#16A34A");
  insertAccount.run(userId, "Rekening Bank BCA", "bank", 0, "#2563EB");
  insertAccount.run(userId, "E-Wallet (GoPay/DANA)", "ewallet", 0, "#0EA5E9");
  insertAccount.run(userId, "Rekening Tabungan", "savings", 0, "#8B5CF6");

  // 2. Default Income Categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (user_id, name, type, icon, color, is_default)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

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

  for (const cat of incomeCategories) {
    insertCategory.run(userId, cat.name, "income", cat.icon, cat.color);
  }

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

  for (const cat of expenseCategories) {
    insertCategory.run(userId, cat.name, "expense", cat.icon, cat.color);
  }

  // 4. Default Daily Limit
  db.prepare(`
    INSERT INTO daily_limits (user_id, amount, is_active)
    VALUES (?, 100000, 1)
  `).run(userId);

  // 5. Welcome Notification
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (?, ?, ?, 'info')
  `).run(
    userId,
    "Selamat Datang di Finora!",
    "Kelola keuangan pribadi, uang saku harian, anggaran bulanan, dan tabungan Anda dengan rapi dan aman."
  );
}
