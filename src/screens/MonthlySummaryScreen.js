import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, formatMonth } from '../theme';

const SV = {
  green: '#228B22', greenLight: '#ADFF2F',
  brown: '#8B4513', sandybrown: '#F4A460', bg: '#228B22',
};

export default function MonthlySummaryScreen() {
  const { getMonthlySummary } = useTransactions();
  const summary = getMonthlySummary();

  const renderItem = ({ item }) => {
    const net = item.income - item.expense;
    const spentPct = item.income > 0 ? Math.min(Math.round((item.expense / item.income) * 100), 100) : 100;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.month}>{formatMonth(item.month)}</Text>
          <Text style={[styles.net, { color: net >= 0 ? SV.green : '#CC0000' }]}>
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </Text>
        </View>
        <View style={styles.row}>
          <View style={styles.stat}>
            <Ionicons name="arrow-up-circle" size={15} color={SV.green} />
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: SV.green }]}>{formatCurrency(item.income)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="arrow-down-circle" size={15} color="#CC0000" />
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: '#CC0000' }]}>{formatCurrency(item.expense)}</Text>
          </View>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${spentPct}%`, backgroundColor: net >= 0 ? SV.green : '#CC0000' }]} />
        </View>
        <Text style={styles.barLabel}>
          {item.income > 0 ? `${spentPct}% of income spent` : 'No income recorded'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Summary</Text>
      </View>
      {summary.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={48} color={SV.greenLight} />
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      ) : (
        <FlatList
          data={summary}
          keyExtractor={item => item.month}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SV.bg },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: SV.greenLight, borderRadius: 16, margin: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: SV.brown },
  list: { padding: 8 },
  card: { backgroundColor: SV.sandybrown, borderRadius: 14, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  month: { fontSize: 17, fontWeight: '700', color: SV.brown },
  net: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { flex: 1, fontSize: 13, color: '#5a3010' },
  statValue: { fontSize: 14, fontWeight: '600' },
  barBg: { height: 8, backgroundColor: SV.brown + '44', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11, color: '#5a3010' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: SV.greenLight, fontWeight: '600' },
});
