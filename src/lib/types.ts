export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense';
export type AllowancePeriodType = 'daily' | 'weekly' | 'monthly';
export type SavingsStatus = 'active' | 'completed' | 'cancelled';
export type NotificationType = 'info' | 'warning' | 'danger' | 'success';

export interface User {
  id: number;
  email: string;
  full_name: string;
  currency: string;
  created_at: string;
  updated_at?: string;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  current_balance?: number;
  color: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_default: number;
  created_at: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  category_id?: number | null;
  account_id: number;
  destination_account_id?: number | null;
  name: string;
  notes?: string | null;
  date: string; // YYYY-MM-DD
  created_at: string;
  updated_at?: string;
  // Joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
  destination_account_name?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  month: number; // 1-12
  year: number;
  amount: number;
  created_at: string;
  updated_at?: string;
  // Calculated fields
  spent?: number;
  remaining?: number;
  percentage?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface DailyLimit {
  id: number;
  user_id: number;
  amount: number;
  is_active: number;
  updated_at?: string;
}

export interface AllowancePlan {
  id: number;
  user_id: number;
  name: string;
  period_type: AllowancePeriodType;
  start_date: string;
  end_date: string;
  target_amount: number;
  spending_limit: number;
  savings_target: number;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Calculated fields
  spent_amount?: number;
  received_amount?: number;
  remaining_spending?: number;
  days_total?: number;
  days_remaining?: number;
  avg_daily_spent?: number;
}

export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string | null;
  account_id?: number | null;
  notes?: string | null;
  status: SavingsStatus;
  created_at: string;
  updated_at?: string;
  account_name?: string;
  percentage?: number;
  remaining?: number;
}

export interface SavingsContribution {
  id: number;
  user_id: number;
  goal_id: number;
  account_id: number;
  amount: number;
  date: string;
  notes?: string | null;
  created_at: string;
  goal_name?: string;
  account_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: number;
  created_at: string;
}

export interface DashboardSummary {
  totalBalance: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  totalSavings: number;
  netCashFlow: number;
  lastMonthIncome: number;
  lastMonthExpense: number;
  incomeChangePercentage: number;
  expenseChangePercentage: number;
}

export interface CashFlowDataPoint {
  label: string; // Day date or Month name
  income: number;
  expense: number;
  net: number;
}

export interface SpendingByCategory {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalAmount: number;
  percentage: number;
  count: number;
}
