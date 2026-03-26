import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, formatDate, todayString } from '../theme';

const SV = {
  green: '#228B22', greenLight: '#ADFF2F',
  brown: '#8B4513', sandybrown: '#F4A460', bg: '#228B22',
};

const PRODUCTS = [
  { id: 'broccoli', name: 'Broccoli', price: 1.50, image: require('../../assets/broccoli.jpg') },
  { id: 'carrots',  name: 'Carrots',  price: 0.99, image: require('../../assets/carrots.png') },
  { id: 'tomato',   name: 'Tomato',   price: 1.20, image: require('../../assets/tomato.png') },
  { id: 'peas',     name: 'Peas',     price: 1.10, image: require('../../assets/greenpeas.webp') },
];

export default function ShopScreen() {
  const { getTransactions, addTransaction } = useTransactions();
  const [basket, setBasket] = useState({});

  const recentOrders = getTransactions().filter(t => t.categoryId === '5').slice(0, 3);

  const basketTotal = Object.entries(basket).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
  const basketCount = Object.values(basket).reduce((s, q) => s + q, 0);

  function changeQty(id, delta) {
    setBasket(prev => {
      const qty = Math.max(0, (prev[id] ?? 0) + delta);
      const next = { ...prev };
      if (qty === 0) delete next[id]; else next[id] = qty;
      return next;
    });
  }

  function handleCheckout() {
    if (basketCount === 0) { Alert.alert('Empty Basket', 'Add some items first!'); return; }
    const desc = Object.entries(basket)
      .map(([id, qty]) => `${qty}x ${PRODUCTS.find(p => p.id === id)?.name}`)
      .join(', ');
    addTransaction({ amount: basketTotal, description: `SpeedyVeg: ${desc}`, categoryId: '5', date: todayString(), type: 'expense' });
    setBasket({});
    Alert.alert('Order Placed! 🥦', `€${basketTotal.toFixed(2)} charged. Your veg is on the way!`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 SpeedyVeg Shop</Text>
        </View>

        <View style={styles.shopGrid}>
          {PRODUCTS.map(product => (
            <View key={product.id} style={styles.shopCard}>
              <Image source={product.image} style={styles.shopImg} resizeMode="cover" />
              <Text style={styles.shopName}>{product.name}</Text>
              <Text style={styles.shopPrice}>€{product.price.toFixed(2)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(product.id, -1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{basket[product.id] ?? 0}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(product.id, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.basketBar}>
          <Text style={styles.basketText}>
            {basketCount > 0 ? `${basketCount} item${basketCount > 1 ? 's' : ''} — €${basketTotal.toFixed(2)}` : 'Your basket is empty'}
          </Text>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Order Now</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Orders</Text>
            {recentOrders.map((tx, index) => (
              <View key={tx.id} style={[styles.txItem, index < recentOrders.length - 1 && styles.txBorder]}>
                <Ionicons name="bag-check-outline" size={20} color={SV.brown} />
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <Text style={styles.txMeta}>{formatDate(tx.date)}</Text>
                </View>
                <Text style={styles.txAmount}>{formatCurrency(tx.amount)}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SV.bg },
  container: { flex: 1, padding: 8 },
  header: {
    backgroundColor: SV.greenLight, borderRadius: 16,
    padding: 14, marginBottom: 12, alignItems: 'center',
  },
  headerTitle: { color: SV.brown, fontSize: 22, fontWeight: '700' },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  shopCard: {
    width: '47%', backgroundColor: SV.greenLight, borderRadius: 12,
    alignItems: 'center', padding: 10, borderWidth: 2, borderColor: SV.brown,
  },
  shopImg: { width: 80, height: 80, borderRadius: 8, marginBottom: 6 },
  shopName: { color: SV.brown, fontWeight: '700', fontSize: 15 },
  shopPrice: { color: SV.brown, fontSize: 13, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    backgroundColor: SV.brown, width: 30, height: 30,
    borderRadius: 15, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { color: SV.greenLight, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  qtyNum: { color: SV.brown, fontWeight: '700', fontSize: 18, minWidth: 24, textAlign: 'center' },
  basketBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SV.brown, borderRadius: 12, padding: 14, marginBottom: 12,
  },
  basketText: { color: SV.greenLight, fontWeight: '600', fontSize: 14, flex: 1 },
  checkoutBtn: { backgroundColor: SV.greenLight, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  checkoutText: { color: SV.brown, fontWeight: '700', fontSize: 14 },
  recentSection: { backgroundColor: SV.sandybrown, borderRadius: 14, padding: 12, marginBottom: 24 },
  recentTitle: { color: SV.brown, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: SV.brown + '66' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 13, fontWeight: '600', color: SV.brown },
  txMeta: { fontSize: 11, color: '#5a3010' },
  txAmount: { fontSize: 13, fontWeight: '700', color: SV.brown },
});
