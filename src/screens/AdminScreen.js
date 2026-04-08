import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Alert, TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { productsAPI, ordersAPI } from '../api';

const SV = { green: '#228B22', greenLight: '#ADFF2F', brown: '#8B4513', sandybrown: '#F4A460', bg: '#228B22' };
const UNITS = ['kg', 'g', 'bunch', 'head', 'each'];
const ORDER_STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    awaiting_photo: '#F97316', photo_review: '#3B82F6', denied: '#EF4444',
    confirmed: '#22C55E', shipped: '#8B5CF6', delivered: '#14B8A6', cancelled: '#6B7280',
  };
  return (
    <View style={[styles.badge, { backgroundColor: colors[status] ?? '#6B7280' }]}>
      <Text style={styles.badgeText}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

// ── Product Form Modal ────────────────────────────────────────────────────────
function ProductModal({ visible, product, onClose, onSave }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name); setPrice(String(product.price));
      setUnit(product.unit); setDescription(product.description ?? '');
      setCategory(product.category ?? ''); setIsActive(product.isActive);
    } else {
      setName(''); setPrice(''); setUnit('kg');
      setDescription(''); setCategory(''); setIsActive(true);
    }
  }, [product, visible]);

  async function handleSave() {
    if (!name || !price) { Alert.alert('Error', 'Name and price are required.'); return; }
    setSaving(true);
    try {
      await onSave({ name, price: parseFloat(price), unit, description, category, isActive });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.errors ? err.errors.map(e => e.msg).join('\n') : (err.message || 'Save failed.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalBox}>
          <Text style={styles.modalTitle}>{product ? 'Edit Product' : 'New Product'}</Text>

          <TextInput style={styles.input} placeholder="Name" placeholderTextColor={SV.brown} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Price (€)" placeholderTextColor={SV.brown} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <TextInput style={styles.input} placeholder="Description" placeholderTextColor={SV.brown} value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Category" placeholderTextColor={SV.brown} value={category} onChangeText={setCategory} />

          <Text style={styles.label}>Unit</Text>
          <View style={styles.unitRow}>
            {UNITS.map(u => (
              <TouchableOpacity key={u} style={[styles.unitBtn, unit === u && styles.unitBtnActive]} onPress={() => setUnit(u)}>
                <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.toggleRow} onPress={() => setIsActive(v => !v)}>
            <Ionicons name={isActive ? 'checkmark-circle' : 'close-circle'} size={22} color={isActive ? SV.green : '#EF4444'} />
            <Text style={styles.toggleText}>{isActive ? 'Active' : 'Inactive'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
            <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Admin Screen ─────────────────────────────────────────────────────────
export default function AdminScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState('orders'); // 'orders' | 'products'

  // Products state
  const [products, setProducts] = useState([]);
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [orderModal, setOrderModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [prods, ords] = await Promise.all([
        productsAPI.getAll(),
        ordersAPI.getAll(token),
      ]);
      setProducts(prods);
      setOrders(ords);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Product actions ──────────────────────────────────────────────────────
  async function handleSaveProduct(data) {
    if (editingProduct) {
      await productsAPI.update(token, editingProduct._id, data);
    } else {
      await productsAPI.create(token, data);
    }
    await fetchAll();
  }

  async function handleDeleteProduct(product) {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await productsAPI.remove(token, product._id);
            await fetchAll();
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not delete.');
          }
        },
      },
    ]);
  }

  // ── Order actions ────────────────────────────────────────────────────────
  async function handleUploadPhoto() {
    if (!photoUrl.trim()) { Alert.alert('Error', 'Enter a photo URL.'); return; }
    try {
      await ordersAPI.uploadPhoto(token, selectedOrder._id, photoUrl.trim());
      setPhotoUrl('');
      setOrderModal(false);
      await fetchAll();
      Alert.alert('Done', 'Photo uploaded — customer can now approve.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not upload photo.');
    }
  }

  async function handleSetStatus(order, status) {
    Alert.alert('Update Status', `Set order to "${status}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          try {
            await ordersAPI.setStatus(token, order._id, status);
            await fetchAll();
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not update status.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={SV.greenLight} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'orders' && styles.tabBtnActive]} onPress={() => setTab('orders')}>
          <Text style={[styles.tabBtnText, tab === 'orders' && styles.tabBtnTextActive]}>Orders ({orders.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'products' && styles.tabBtnActive]} onPress={() => setTab('products')}>
          <Text style={[styles.tabBtnText, tab === 'products' && styles.tabBtnTextActive]}>Products ({products.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={SV.greenLight} />}
      >

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <View>
            {orders.length === 0
              ? <Text style={styles.emptyText}>No orders yet.</Text>
              : orders.map(order => (
                <View key={order._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>#{order._id.slice(-6).toUpperCase()}</Text>
                    <StatusBadge status={order.status} />
                  </View>
                  <Text style={styles.cardSub}>
                    {order.user?.name ?? 'Unknown'} · {order.user?.email ?? ''}
                  </Text>
                  <Text style={styles.cardSub}>
                    {order.items?.length ?? 0} item(s) · €{order.total?.toFixed(2) ?? '0.00'}
                  </Text>

                  {/* Upload photo button — only when awaiting or denied */}
                  {(order.status === 'awaiting_photo' || order.status === 'denied') && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedOrder(order); setOrderModal(true); }}>
                      <Ionicons name="camera-outline" size={16} color={SV.greenLight} />
                      <Text style={styles.actionBtnText}>Upload Photo</Text>
                    </TouchableOpacity>
                  )}

                  {/* Status buttons */}
                  <View style={styles.statusRow}>
                    {ORDER_STATUSES.map(s => (
                      <TouchableOpacity key={s} style={styles.statusBtn} onPress={() => handleSetStatus(order, s)}>
                        <Text style={styles.statusBtnText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            }
          </View>
        )}

        {/* ── PRODUCTS TAB ── */}
        {tab === 'products' && (
          <View>
            <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingProduct(null); setProductModal(true); }}>
              <Ionicons name="add-circle-outline" size={20} color={SV.brown} />
              <Text style={styles.addBtnText}>Add Product</Text>
            </TouchableOpacity>

            {products.map(product => (
              <View key={product._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <View style={[styles.badge, { backgroundColor: product.isActive ? SV.green : '#6B7280' }]}>
                    <Text style={styles.badgeText}>{product.isActive ? 'active' : 'inactive'}</Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>€{product.price.toFixed(2)} / {product.unit}</Text>
                {product.category ? <Text style={styles.cardSub}>{product.category}</Text> : null}
                <View style={styles.productActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingProduct(product); setProductModal(true); }}>
                    <Ionicons name="pencil-outline" size={16} color={SV.greenLight} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDeleteProduct(product)}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Product modal */}
      <ProductModal
        visible={productModal}
        product={editingProduct}
        onClose={() => setProductModal(false)}
        onSave={handleSaveProduct}
      />

      {/* Upload photo modal */}
      <Modal visible={orderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Upload Order Photo</Text>
            <Text style={styles.cardSub}>Enter a URL for the photo of the packed order.</Text>
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="https://..."
              placeholderTextColor={SV.brown}
              value={photoUrl}
              onChangeText={setPhotoUrl}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.btn} onPress={handleUploadPhoto}>
              <Text style={styles.btnText}>Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOrderModal(false)}>
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
  tabRow: { flexDirection: 'row', backgroundColor: SV.brown, padding: 6, gap: 6 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: SV.greenLight },
  tabBtnText: { color: SV.greenLight, fontWeight: '600', fontSize: 13 },
  tabBtnTextActive: { color: SV.brown },
  card: {
    backgroundColor: SV.greenLight, borderRadius: 12,
    padding: 12, marginBottom: 10, borderWidth: 2, borderColor: SV.brown,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: SV.brown, fontWeight: '700', fontSize: 15 },
  cardSub: { color: '#5a3010', fontSize: 13, marginBottom: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statusBtn: { backgroundColor: SV.brown, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusBtnText: { color: SV.greenLight, fontSize: 12, fontWeight: '600' },
  productActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SV.brown, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionBtnDanger: { backgroundColor: '#EF4444' },
  actionBtnText: { color: SV.greenLight, fontSize: 13, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SV.sandybrown, borderRadius: 10, padding: 12, marginBottom: 10 },
  addBtnText: { color: SV.brown, fontWeight: '700', fontSize: 15 },
  emptyText: { color: SV.greenLight, textAlign: 'center', marginTop: 40, fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: SV.greenLight, borderRadius: 16, padding: 20 },
  modalTitle: { color: SV.brown, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    fontSize: 15, color: SV.brown, marginBottom: 10, borderWidth: 1, borderColor: SV.brown,
  },
  label: { color: SV.brown, fontWeight: '600', fontSize: 13, marginBottom: 6 },
  unitRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  unitBtn: { borderWidth: 1, borderColor: SV.brown, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  unitBtnActive: { backgroundColor: SV.brown },
  unitBtnText: { color: SV.brown, fontSize: 13 },
  unitBtnTextActive: { color: SV.greenLight },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  toggleText: { color: SV.brown, fontSize: 14, fontWeight: '600' },
  btn: { backgroundColor: SV.brown, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnText: { color: SV.greenLight, fontWeight: '700', fontSize: 15 },
  cancelText: { color: SV.brown, textAlign: 'center', fontSize: 14 },
});
