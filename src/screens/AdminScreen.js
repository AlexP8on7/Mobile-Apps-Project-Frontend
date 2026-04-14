import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Alert, TextInput, Modal, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { productsAPI, ordersAPI, messagesAPI } from '../api';

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
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('kg');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name); setPrice(String(product.price));
      setStock(String(product.stock ?? 0));
      setUnit(product.unit); setDescription(product.description ?? '');
      setCategory(product.category ?? ''); setIsActive(product.isActive);
    } else {
      setName(''); setPrice(''); setStock(''); setUnit('kg');
      setDescription(''); setCategory(''); setIsActive(true);
    }
  }, [product, visible]);

  async function handleSave() {
    if (!name || !price) { Alert.alert('Error', 'Name and price are required.'); return; }
    setSaving(true);
    try {
      await onSave({ name, price: parseFloat(price), stock: parseInt(stock || '0', 10), unit, description, category, isActive });
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
          <TextInput style={styles.input} placeholder="Stock (units)" placeholderTextColor={SV.brown} value={stock} onChangeText={setStock} keyboardType="number-pad" />
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
  const [tab, setTab] = useState('orders');

  // Products state
  const [products, setProducts] = useState([]);
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [orderModal, setOrderModal] = useState(false);
  const [trackingInputs, setTrackingInputs] = useState({});

  // Messages state
  const [msgOrder, setMsgOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [msgModal, setMsgModal] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

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
  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

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
    if (!photoUrl.trim()) { Alert.alert('Error', 'Please pick a photo first.'); return; }
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

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Denied', 'We need photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      setPhotoUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Denied', 'We need camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      setPhotoUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }

  async function openMessages(order) {
    setMsgOrder(order);
    setMsgText('');
    setMsgModal(true);
    setLoadingMsgs(true);
    try {
      const data = await messagesAPI.get(token, order._id);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function sendMessage() {
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      await messagesAPI.send(token, msgOrder._id, msgText.trim());
      setMsgText('');
      const updated = await messagesAPI.get(token, msgOrder._id);
      setMessages(updated);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send message.');
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleSetTracking(order) {
    const trackingNumber = (trackingInputs[order._id] || '').trim();
    if (!trackingNumber) { Alert.alert('Error', 'Enter a tracking number.'); return; }
    try {
      await ordersAPI.setTracking(token, order._id, trackingNumber);
      setTrackingInputs(prev => ({ ...prev, [order._id]: '' }));
      await fetchAll();
      Alert.alert('Done', 'Tracking number saved — order marked as shipped.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save tracking.');
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
                    {`${order.items?.length ?? 0} item(s) · €${(order.totalPrice ?? 0).toFixed(2)}`}
                  </Text>

                  {/* Tracking number input — only for confirmed orders */}
                  {order.status === 'confirmed' && (
                    <View style={styles.trackingRow}>
                      <TextInput
                        style={styles.trackingInput}
                        placeholder="Tracking number"
                        placeholderTextColor={SV.brown}
                        value={trackingInputs[order._id] || ''}
                        onChangeText={v => setTrackingInputs(prev => ({ ...prev, [order._id]: v }))}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetTracking(order)}>
                        <Ionicons name="location-outline" size={16} color={SV.greenLight} />
                        <Text style={styles.actionBtnText}>Track</Text>
                      </TouchableOpacity>
                    </View>
                  )}

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

                  {/* Messages button */}
                  <TouchableOpacity style={[styles.actionBtn, { marginTop: 8 }]} onPress={() => openMessages(order)}>
                    <Ionicons name="chatbubble-outline" size={16} color={SV.greenLight} />
                    <Text style={styles.actionBtnText}>Messages</Text>
                  </TouchableOpacity>
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

      {/* Messages modal */}
      <Modal visible={msgModal} animationType="slide">
        <SafeAreaView style={styles.safe}>
          <View style={styles.msgHeader}>
            <TouchableOpacity onPress={() => setMsgModal(false)}>
              <Ionicons name="arrow-back" size={24} color={SV.brown} />
            </TouchableOpacity>
            <Text style={styles.msgHeaderTitle}>Order #{msgOrder?._id.slice(-6).toUpperCase()}</Text>
          </View>

          <ScrollView style={{ flex: 1, padding: 12 }}>
            {loadingMsgs && <ActivityIndicator color={SV.greenLight} style={{ marginTop: 20 }} />}
            {!loadingMsgs && messages.length === 0 && (
              <Text style={styles.emptyText}>No messages yet.</Text>
            )}
            {messages.map(m => (
              <View key={m._id} style={[styles.msgBubble, m.senderRole === 'admin' ? styles.msgAdmin : styles.msgUser]}>
                <Text style={styles.msgSender}>{m.sender?.name} ({m.senderRole})</Text>
                <Text style={styles.msgText}>{m.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.msgInputRow}>
            <TextInput
              style={styles.msgInput}
              placeholder="Reply as admin…"
              placeholderTextColor={SV.brown}
              value={msgText}
              onChangeText={setMsgText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={sendingMsg}>
              {sendingMsg
                ? <ActivityIndicator size="small" color={SV.greenLight} />
                : <Ionicons name="send" size={18} color={SV.greenLight} />}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Upload photo modal */}
      <Modal visible={orderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Upload Order Photo</Text>

            <View style={styles.photoPickerRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={22} color={SV.greenLight} />
                <Text style={styles.photoBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickFromLibrary}>
                <Ionicons name="image-outline" size={22} color={SV.greenLight} />
                <Text style={styles.photoBtnText}>Library</Text>
              </TouchableOpacity>
            </View>

            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="image-outline" size={40} color={SV.brown} />
                <Text style={styles.cardSub}>No photo selected</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.btn, !photoUrl && { opacity: 0.5 }]} onPress={handleUploadPhoto} disabled={!photoUrl}>
              <Text style={styles.btnText}>Upload Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setOrderModal(false); setPhotoUrl(''); }}>
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
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  trackingInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 8,
    fontSize: 13, color: SV.brown, borderWidth: 1, borderColor: SV.brown,
  },
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
  photoPickerRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: SV.brown, borderRadius: 10, padding: 12 },
  photoBtnText: { color: SV.greenLight, fontWeight: '700', fontSize: 14 },
  photoPreview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12 },
  photoPlaceholder: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: SV.brown },
  msgHeaderTitle: { flex: 1, color: SV.brown, fontWeight: '700', fontSize: 16 },
  msgBubble: { borderRadius: 10, padding: 10, marginBottom: 8, maxWidth: '80%' },
  msgAdmin: { backgroundColor: SV.brown, alignSelf: 'flex-end' },
  msgUser: { backgroundColor: SV.sandybrown, alignSelf: 'flex-start' },
  msgSender: { fontSize: 11, fontWeight: '700', color: SV.greenLight, marginBottom: 2 },
  msgText: { fontSize: 13, color: '#fff' },
  msgInputRow: { flexDirection: 'row', gap: 8, padding: 10, alignItems: 'center', backgroundColor: SV.greenLight },
  msgInput: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, fontSize: 14, color: SV.brown, borderWidth: 1, borderColor: SV.brown },
  sendBtn: { backgroundColor: SV.brown, borderRadius: 10, padding: 10 },
  cancelText: { color: SV.brown, textAlign: 'center', fontSize: 14 },
});
