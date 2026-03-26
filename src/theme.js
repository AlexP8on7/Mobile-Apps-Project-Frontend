export const COLORS = {
  primary: '#2C6BED',
  primaryLight: '#EEF3FD',
  income: '#22C55E',
  incomeLight: '#DCFCE7',
  expense: '#EF4444',
  expenseLight: '#FEE2E2',
  background: '#F1F5F9',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
};

export const SIZES = {
  padding: 16,
  radius: 12,
  radiusSm: 8,
};

export function formatCurrency(amount) {
  return `€${parseFloat(amount).toFixed(2)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

export function formatMonth(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function todayString() {
  return new Date().toISOString().split('T')[0];
}
