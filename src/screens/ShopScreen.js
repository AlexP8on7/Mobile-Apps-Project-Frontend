import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { productsAPI, basketAPI, ordersAPI, recipesAPI } from '../api';
import { formatCurrency } from '../theme';

const SV = {
  green: '#228B22', greenLight: '#ADFF2F',
  brown: '#8B4513', sandybrown: '#F4A460', bg: '#228B22',
};

export default function ShopScreen({ navigation }) {
  const { token, user } = useAuth();

  const [products, setProducts] = useState([]);
  const [basket, setBasket] = useState({ items: [], total: 0 });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [recipes, setRecipes] = useState(null);

  // Checkout modal state
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await productsAPI.getAll();
      setProducts(data.filter(p => p.isActive));
    } catch {
      Alert.alert('Error', 'Could not load products.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchBasket = useCallback(async () => {
    if (!token) return;
    try {
      const data = await basketAPI.get(token);
      setBasket(data);
    } catch {
      // basket may be empty — ignore
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    fetchBasket();
  }, [fetchProducts, fetchBasket]);

  function getQty(productId) {
    const item = basket.items?.find(i => i.product._id === productId);
    return item ? item.quantity : 0;
  }

  async function changeQty(productId, delta) {
    if (!token) { navigation.navigate('Login'); return; }
    const current = getQty(productId);
    const next = current + delta;
    try {
      if (next <= 0) {
        await basketAPI.removeItem(token, productId);
      } else if (current === 0) {
        await basketAPI.addItem(token, productId, 1);
      } else {
        await basketAPI.setQuantity(token, productId, next);
      }
      await fetchBasket();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update basket.');
    }
  }

  async function handleCheckout() {
    if (!basket.items?.length) { Alert.alert('Empty Basket', 'Add some items first!'); return; }
    if (!street || !city || !postcode) { Alert.alert('Error', 'Please fill in your delivery address.'); return; }
    setPlacingOrder(true);
    try {
      await ordersAPI.create(token, { street, city, postcode, country: 'Ireland' });
      await fetchBasket();
      setCheckoutVisible(false);
      setStreet(''); setCity(''); setPostcode('');
      Alert.alert('Order Placed! 🥦', 'Your veg is on the way!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not place order.');
    } finally {
      setPlacingOrder(false);
    }
  }

  async function handleGetRecipes() {
    if (!basket.items?.length) { Alert.alert('Empty Basket', 'Add items to get recipe ideas!'); return; }
    setLoadingRecipes(true);
    setRecipes(null);
    try {
      const data = await recipesAPI.fromCart(token);
      setRecipes(data.recipes);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not fetch recipes.');
    } finally {
      setLoadingRecipes(false);
    }
  }

  if (loadingProducts) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={SV.greenLight} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 SpeedyVeg Shop</Text>
          {user && <Text style={styles.headerSub}>Hi, {user.name}</Text>}
        </View>

        {/* Product grid */}
        <View style={styles.shopGrid}>
          {products.map(product => (
            <View key={product._id} style={styles.shopCard}>
              {product.image
                ? <Image source={{ uri: product.image }} style={styles.shopImg} resizeMode="cover" />
                : <View style={[styles.shopImg, styles.shopImgPlaceholder]}><Ionicons name="leaf" size={36} color={SV.brown} /></View>
              }
              <Text style={styles.shopName}>{product.name}</Text>
              <Text style={styles.shopPrice}>{formatCurrency(product.price)} / {product.unit}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(product._id, -1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{getQty(product._id)}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(product._id, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Basket bar */}
        <View style={styles.basketBar}>
          <Text style={styles.basketText}>
            {basket.items?.length
              ? `${basket.items.length} item${basket.items.length > 1 ? 's' : ''} — ${formatCurrency(basket.total)}`
              : 'Your basket is empty'}
          </Text>
          <TouchableOpacity style={styles.checkoutBtn} onPress={() => setCheckoutVisible(true)}>
            <Text style={styles.checkoutText}>Order Now</Text>
          </TouchableOpacity>
        </View>

        {/* Recipe suggestions */}
        <TouchableOpacity style={styles.recipeBar} onPress={handleGetRecipes} disabled={loadingRecipes}>
          {loadingRecipes
            ? <ActivityIndicator color={SV.brown} />
            : <Text style={styles.recipeBarText}>🍳 Get Recipe Ideas from Basket</Text>
          }
        </TouchableOpacity>

        {recipes && (
          <View style={styles.recipesSection}>
            <Text style={styles.recipesTitle}>Recipe Ideas</Text>
            {recipes.map((r, i) => (
              <View key={i} style={styles.recipeCard}>
                <Text style={styles.recipeName}>{r.name}</Text>
                <Text style={styles.recipeDesc}>{r.description}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Checkout modal */}
      <Modal visible={checkoutVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delivery Address</Text>
            <TextInput style={styles.modalInput} placeholder="Street" placeholderTextColor={SV.brown} value={street} onChangeText={setStreet} />
            <TextInput style={styles.modalInput} placeholder="City" placeholderTextColor={SV.brown} value={city} onChangeText={setCity} />
            <TextInput style={styles.modalInput} placeholder="Postcode" placeholderTextColor={SV.brown} value={postcode} onChangeText={setPostcode} />
            <TouchableOpacity style={styles.btn} onPress={handleCheckout} disabled={placingOrder}>
              <Text style={styles.btnText}>{placingOrder ? 'Placing order…' : 'Confirm Order'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerSub: { color: SV.brown, fontSize: 13, marginTop: 2 },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  shopCard: {
    width: '47%', backgroundColor: SV.greenLight, borderRadius: 12,
    alignItems: 'center', padding: 10, borderWidth: 2, borderColor: SV.brown,
  },
  shopImg: { width: 80, height: 80, borderRadius: 8, marginBottom: 6 },
  shopImgPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: SV.sandybrown },
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
    backgroundColor: SV.brown, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  basketText: { color: SV.greenLight, fontWeight: '600', fontSize: 14, flex: 1 },
  checkoutBtn: { backgroundColor: SV.greenLight, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  checkoutText: { color: SV.brown, fontWeight: '700', fontSize: 14 },
  recipeBar: {
    backgroundColor: SV.sandybrown, borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 12,
  },
  recipeBarText: { color: SV.brown, fontWeight: '700', fontSize: 14 },
  recipesSection: { backgroundColor: SV.sandybrown, borderRadius: 14, padding: 12, marginBottom: 24 },
  recipesTitle: { color: SV.brown, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  recipeCard: { marginBottom: 10 },
  recipeName: { color: SV.brown, fontWeight: '700', fontSize: 14 },
  recipeDesc: { color: '#5a3010', fontSize: 13 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: SV.greenLight, borderRadius: 16, padding: 20 },
  modalTitle: { color: SV.brown, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    fontSize: 15, color: SV.brown, marginBottom: 10, borderWidth: 1, borderColor: SV.brown,
  },
  btn: { backgroundColor: SV.brown, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4, marginBottom: 10 },
  btnText: { color: SV.greenLight, fontWeight: '700', fontSize: 15 },
  cancelText: { color: SV.brown, textAlign: 'center', fontSize: 14 },
});
