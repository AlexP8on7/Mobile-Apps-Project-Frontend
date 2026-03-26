import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../context/TransactionContext';
import { CATEGORIES } from '../data/data';
import { todayString } from '../theme';

const SV = {
  green: '#228B22', greenLight: '#ADFF2F',
  brown: '#8B4513', sandybrown: '#F4A460', bg: '#228B22',
};

export default function AddTransactionScreen({ navigation }) {
  const { addTransaction } = useTransactions();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('2');
  const [date, setDate] = useState(todayString());

  const filteredCategories = CATEGORIES.filter(c => c.type === type);

  function handleTypeChange(newType) {
    setType(newType);
    const first = CATEGORIES.find(c => c.type === newType);
    if (first) setCategoryId(first.id);
  }

  function handleSave() {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.'); return; }
    if (!description.trim()) { Alert.alert('Missing Description', 'Please enter a description.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { Alert.alert('Invalid Date', 'Date must be in YYYY-MM-DD format.'); return; }
    addTransaction({ amount: parsed, description: description.trim(), categoryId, date, type });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
              onPress={() => handleTypeChange('expense')}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color={type === 'expense' ? SV.brown : '#5a3010'} />
              <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
              onPress={() => handleTypeChange('income')}
            >
              <Ionicons name="arrow-up-circle-outline" size={18} color={type === 'income' ? SV.brown : '#5a3010'} />
              <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Income</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Amount (€)</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor="#5a3010"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Broccoli order"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#5a3010"
              returnKeyType="done"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categories}>
              {filteredCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <Text style={[styles.catName, categoryId === cat.id && styles.catNameActive]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={18} color={SV.brown} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#5a3010"
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="done"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Payment</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SV.bg },
  container: { flex: 1, padding: 16 },
  typeToggle: {
    flexDirection: 'row', backgroundColor: SV.sandybrown,
    borderRadius: 14, padding: 4, marginBottom: 16, gap: 4,
  },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  typeBtnActive: { backgroundColor: SV.greenLight },
  typeBtnText: { fontWeight: '600', color: '#5a3010', fontSize: 15 },
  typeBtnTextActive: { color: SV.brown },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: SV.greenLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  amountInput: {
    backgroundColor: SV.sandybrown, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 28, fontWeight: '700', color: SV.brown,
    borderWidth: 2, borderColor: SV.brown,
  },
  input: {
    backgroundColor: SV.sandybrown, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: SV.brown,
    borderWidth: 2, borderColor: SV.brown,
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 2, borderColor: SV.brown,
    gap: 4, backgroundColor: SV.sandybrown,
  },
  catChipActive: { backgroundColor: SV.greenLight },
  catIcon: { fontSize: 14 },
  catName: { fontSize: 13, fontWeight: '500', color: SV.brown },
  catNameActive: { color: SV.brown, fontWeight: '700' },
  dateRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: SV.sandybrown, borderRadius: 12,
    borderWidth: 2, borderColor: SV.brown, paddingHorizontal: 14,
  },
  dateInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: SV.brown },
  saveBtn: {
    backgroundColor: SV.greenLight, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8, marginBottom: 40,
    borderWidth: 2, borderColor: SV.brown,
  },
  saveBtnText: { color: SV.brown, fontSize: 16, fontWeight: '700' },
});
