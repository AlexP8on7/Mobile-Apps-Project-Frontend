import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, formatDate } from '../theme';

const SV = {
  green: '#228B22', greenLight: '#ADFF2F',
  brown: '#8B4513', sandybrown: '#F4A460', bg: '#228B22',
};

export default function TransactionListScreen({ navigation }) {
  const { getTransactions, deleteTransaction } = useTransactions();
  const transactions = getTransactions();
  const [, forceUpdate] = useState(0);

  function handleDelete(tx) {
    Alert.alert('Delete Payment', `Delete "${tx.description}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTransaction(tx.id); forceUpdate(n => n + 1); } },
    ]);
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('EditTransaction', { transaction: item })}
      activeOpacity={0.7}
    >
      <View style={styles.icon}>
        <Text style={styles.emoji}>{item.category.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.meta}>{item.category.name} · {formatDate(item.date)}</Text>
      </View>
      <Text style={[styles.amount, { color: item.type === 'income' ? SV.green : '#CC0000' }]}>
        {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
      </Text>
      <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={SV.brown} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Payments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddTransaction')}>
          <Ionicons name="add" size={24} color={SV.brown} />
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={SV.brown} />
          <Text style={styles.emptyText}>No payments yet</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddTransaction')}>
            <Text style={styles.emptyBtnText}>Add your first payment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SV.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: SV.greenLight, borderRadius: 16, margin: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: SV.brown },
  addBtn: {
    backgroundColor: SV.sandybrown, width: 36, height: 36,
    borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  list: { padding: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SV.sandybrown, borderRadius: 14,
    padding: 14, gap: 12,
  },
  icon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: SV.greenLight, justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  desc: { fontSize: 15, fontWeight: '600', color: SV.brown },
  meta: { fontSize: 12, color: '#5a3010', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: SV.greenLight, fontWeight: '600' },
  emptyBtn: { backgroundColor: SV.sandybrown, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { color: SV.brown, fontWeight: '700' },
});
