// ─────────────────────────────────────────────────────────────────────────────
// DATA LAYER — In-Memory (no persistence)
// ─────────────────────────────────────────────────────────────────────────────
// NOTE TO STUDENTS:
//   All data lives in a plain JavaScript array. When the app closes, it is gone.
//
//   Every function below maps directly to a SQL concept:
//     getTransactions()    →  SELECT t.*, c.* FROM transactions t JOIN categories c ...  ORDER BY date DESC
//     addTransaction()     →  INSERT INTO transactions (amount, description, ...) VALUES (?, ?, ...)
//     updateTransaction()  →  UPDATE transactions SET ... WHERE id = ?
//     deleteTransaction()  →  DELETE FROM transactions WHERE id = ?
//     getMonthlySummary()  →  SELECT strftime('%Y-%m', date), SUM(amount) ... GROUP BY month, type
// ─────────────────────────────────────────────────────────────────────────────

// ─── Categories ──────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: '1', name: 'Salary',            color: '#22C55E', icon: '💼', type: 'income'  },
  { id: '2', name: 'Food & Drink',      color: '#F97316', icon: '🍔', type: 'expense' },
  { id: '3', name: 'Transport',         color: '#3B82F6', icon: '🚗', type: 'expense' },
  { id: '4', name: 'Entertainment',     color: '#A855F7', icon: '🎬', type: 'expense' },
  { id: '5', name: 'Shopping',          color: '#EC4899', icon: '🛍️', type: 'expense' },
  { id: '6', name: 'Bills & Utilities', color: '#EF4444', icon: '💡', type: 'expense' },
  { id: '7', name: 'Health',            color: '#14B8A6', icon: '💊', type: 'expense' },
  { id: '8', name: 'Other Income',      color: '#84CC16', icon: '💰', type: 'income'  },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[1];
}

// ─── Seed data ───────────────────────────────────────────────────────────────
export const SEED_TRANSACTIONS = [
  // January 2026
  { id: '101', amount: 3200,  description: 'Monthly salary',    categoryId: '1', date: '2026-01-01', type: 'income'  },
  { id: '102', amount: 850,   description: 'Rent',              categoryId: '6', date: '2026-01-02', type: 'expense' },
  { id: '103', amount: 45,    description: 'Groceries',         categoryId: '2', date: '2026-01-05', type: 'expense' },
  { id: '104', amount: 12.50, description: 'Bus pass',          categoryId: '3', date: '2026-01-06', type: 'expense' },
  { id: '105', amount: 18,    description: 'Cinema tickets',    categoryId: '4', date: '2026-01-10', type: 'expense' },
  { id: '106', amount: 65,    description: 'Winter jacket',     categoryId: '5', date: '2026-01-14', type: 'expense' },
  { id: '107', amount: 38,    description: 'Pharmacy',          categoryId: '7', date: '2026-01-18', type: 'expense' },
  { id: '108', amount: 55,    description: 'Restaurant dinner', categoryId: '2', date: '2026-01-22', type: 'expense' },
  { id: '109', amount: 200,   description: 'Freelance work',    categoryId: '8', date: '2026-01-25', type: 'income'  },
  { id: '110', amount: 90,    description: 'Electricity bill',  categoryId: '6', date: '2026-01-28', type: 'expense' },
  // February 2026
  { id: '201', amount: 3200,  description: 'Monthly salary',    categoryId: '1', date: '2026-02-01', type: 'income'  },
  { id: '202', amount: 850,   description: 'Rent',              categoryId: '6', date: '2026-02-02', type: 'expense' },
  { id: '203', amount: 52,    description: 'Groceries',         categoryId: '2', date: '2026-02-04', type: 'expense' },
  { id: '204', amount: 12.50, description: 'Bus pass',          categoryId: '3', date: '2026-02-06', type: 'expense' },
  { id: '205', amount: 120,   description: 'Valentine dinner',  categoryId: '2', date: '2026-02-14', type: 'expense' },
  { id: '206', amount: 35,    description: 'Spotify + Netflix', categoryId: '4', date: '2026-02-15', type: 'expense' },
  { id: '207', amount: 80,    description: 'New shoes',         categoryId: '5', date: '2026-02-18', type: 'expense' },
  { id: '208', amount: 25,    description: 'GP visit',          categoryId: '7', date: '2026-02-20', type: 'expense' },
  { id: '209', amount: 500,   description: 'Bonus',             categoryId: '8', date: '2026-02-25', type: 'income'  },
  { id: '210', amount: 78,    description: 'Gas bill',          categoryId: '6', date: '2026-02-26', type: 'expense' },
  // March 2026
  { id: '301', amount: 3200,  description: 'Monthly salary',    categoryId: '1', date: '2026-03-01', type: 'income'  },
  { id: '302', amount: 850,   description: 'Rent',              categoryId: '6', date: '2026-03-02', type: 'expense' },
  { id: '303', amount: 48,    description: 'Groceries',         categoryId: '2', date: '2026-03-07', type: 'expense' },
  { id: '304', amount: 12.50, description: 'Bus pass',          categoryId: '3', date: '2026-03-08', type: 'expense' },
  { id: '305', amount: 30,    description: 'Coffee & lunch',    categoryId: '2', date: '2026-03-12', type: 'expense' },
  { id: '306', amount: 15,    description: 'Parking',           categoryId: '3', date: '2026-03-15', type: 'expense' },
  { id: '307', amount: 95,    description: 'New headphones',    categoryId: '5', date: '2026-03-18', type: 'expense' },
  { id: '308', amount: 150,   description: 'Freelance project', categoryId: '8', date: '2026-03-20', type: 'income'  },
];
