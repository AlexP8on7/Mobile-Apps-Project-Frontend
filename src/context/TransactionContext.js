import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getCategoryById } from '../data/data';

// ─────────────────────────────────────────────────────────────────────────────
// TransactionContext — SQLite-backed store
// ─────────────────────────────────────────────────────────────────────────────
// CRUD ops write to the DB then mirror the change into local state so screens
// re-render immediately — no second SELECT needed.
// getTransactions / getMonthlySummary stay synchronous (they read from state),
// so no screen changes are required.
// ─────────────────────────────────────────────────────────────────────────────

const TransactionContext = createContext(null);

export function TransactionProvider({ children }) {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState([]);

  // ── SELECT * FROM transactions  (runs once on mount)
  useEffect(() => {
    db.getAllAsync('SELECT * FROM transactions').then(rows => {
      setTransactions(rows);
    });
  }, [db]);

  // ── SELECT t.*, c.* FROM transactions t
  //          JOIN categories c ON t.categoryId = c.id
  //         ORDER BY t.date DESC
  const getTransactions = useCallback(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(t => ({ ...t, category: getCategoryById(t.categoryId) }));
  }, [transactions]);

  // ── INSERT INTO transactions (id, amount, description, categoryId, date, type)
  //    VALUES (?, ?, ?, ?, ?, ?)
  const addTransaction = useCallback(({ amount, description, categoryId, date, type }) => {
    const id = Date.now().toString();
    const parsedAmount = parseFloat(amount);
    const newTx = { id, amount: parsedAmount, description, categoryId, date, type };
    setTransactions(prev => [...prev, newTx]);
    db.runAsync(
      'INSERT INTO transactions (id, amount, description, categoryId, date, type) VALUES (?, ?, ?, ?, ?, ?)',
      [id, parsedAmount, description, categoryId, date, type]
    );
    return newTx;
  }, [db]);

  // ── UPDATE transactions SET amount=?, description=?, categoryId=?, date=?, type=?
  //    WHERE id = ?
  const updateTransaction = useCallback((id, { amount, description, categoryId, date, type }) => {
    const parsedAmount = parseFloat(amount);
    setTransactions(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, amount: parsedAmount, description, categoryId, date, type }
          : t
      )
    );
    db.runAsync(
      'UPDATE transactions SET amount=?, description=?, categoryId=?, date=?, type=? WHERE id=?',
      [parsedAmount, description, categoryId, date, type, id]
    );
  }, [db]);

  // ── DELETE FROM transactions WHERE id = ?
  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  }, [db]);

  // ── SELECT strftime('%Y-%m', date) AS month,
  //          type, SUM(amount) AS total
  //     FROM transactions
  //    GROUP BY month, type
  //    ORDER BY month DESC
  const getMonthlySummary = useCallback(() => {
    const map = {};
    for (const t of transactions) {
      const month = t.date.substring(0, 7); // 'YYYY-MM'
      if (!map[month]) map[month] = { month, income: 0, expense: 0 };
      map[month][t.type] += t.amount;
    }
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions]);

  return (
    <TransactionContext.Provider
      value={{ getTransactions, addTransaction, updateTransaction, deleteTransaction, getMonthlySummary }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used inside TransactionProvider');
  return ctx;
}