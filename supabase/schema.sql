-- ==============================================================================
-- FINORA — PERSONAL FINANCE TRACKER
-- Database Schema for Supabase (PostgreSQL)
-- ==============================================================================

-- 1. TABEL USERS (Pengguna Finora)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  currency TEXT DEFAULT 'IDR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL ACCOUNTS (Akun Keuangan: Dompet, Rekening Bank, E-Wallet, Tabungan)
CREATE TABLE IF NOT EXISTS accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'savings')),
  initial_balance NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#2563EB',
  is_active INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL CATEGORIES (Kategori Pemasukan & Pengeluaran)
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#2563EB',
  is_default INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL TRANSACTIONS (Pencatatan Pemasukan, Pengeluaran, dan Transfer)
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  destination_account_id BIGINT REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL BUDGETS (Anggaran Bulanan per Kategori)
CREATE TABLE IF NOT EXISTS budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- 6. TABEL DAILY LIMITS (Batas Pengeluaran Harian Pengguna)
CREATE TABLE IF NOT EXISTS daily_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  is_active INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL ALLOWANCE PLANS (Rencana Uang Saku Harian/Mingguan/Bulanan)
CREATE TABLE IF NOT EXISTS allowance_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  spending_limit NUMERIC NOT NULL CHECK (spending_limit > 0),
  savings_target NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL SAVINGS GOALS (Target Impian Finansial / Tabungan)
CREATE TABLE IF NOT EXISTS savings_goals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  target_date DATE,
  account_id BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL SAVINGS CONTRIBUTIONS (Setoran Dana ke Target Tabungan)
CREATE TABLE IF NOT EXISTS savings_contributions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id BIGINT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL NOTIFICATIONS (Notifikasi Sistem In-App)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'danger', 'success')),
  is_read INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES UNTUK KINERJA QUERY TINGGI
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
