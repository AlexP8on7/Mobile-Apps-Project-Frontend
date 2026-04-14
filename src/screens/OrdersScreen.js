import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, messagesAPI } from '../api';

const SV = { green: '#228B22', greenLight: '#ADFF2F', brown: '#8B4513', sandybrown: '#F4A460', bg: '#228B22' };

const STATUS_COLORS = {
  awaiting_photo: '#F97316', photo_review: '#3B82F6', denied: '#EF4444',
  confirmed: '#22C55E', shipped: '#8B5CF6', delivered: '#14B8A6', cancelled: '#6B7280',
};

function StatusBadge({ status }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] ?? '#6B7280' }]}>
      <Text style={styles.badgeText}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

function OrderDetail({ order, token, onClose, onRefresh }) {
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    messagesAPI.get(token, order._id)
      .then(setMessages)
      .catch(() => {});
  }, [order._id, token]);

  async function loadTracking() {
    setTrackingLoading(true);
    try {
      const data = await ordersAPI.getTracking(token, order._id);
      setTracking(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load tracking.');
    } finally {
      setTrackingLoading(false);
    }
  }

  async function sendMessage() {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      await messagesAPI.send(token, order._id, msgText.trim());
      setMsgText('');
      const updated = await messagesAPI.get(token, order._id);
      setMessages(updated);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  }

  async function handleApproval(approved) {
    try {
      await ordersAPI.approve(token, order._id, approved);
      onRefresh();
      onClose();
      Alert.alert(approved ? 'Order Approved ✅' : 'Order Denied ❌', approved ? 'Your order is confirmed!' : 'Admin will re-pick your order.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit approval.');
    }
  }

  return (
    <Modal visible animationType="slide">
      <SafeAreaView style={styles.safe}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={SV.brown} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Order #{order._id.slice(-6).toUpperCase()}</Text>
          <StatusBadge status={order.status} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={m => m._id}
          contentContainerStyle={{ padding: 12 }}
          ListHeaderComponent={
            <View>
              {/* Items */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Items</Text>
                {order.items?.map((item, i) => (
                  <Text key={i} style={styles.itemText}>
                    {item.quantity}x {item.productName} — €{(item.lineTotal ?? 0).toFixed(2)}
                  </Text>
                ))}
                <Text style={styles.totalText}>Total: €{(order.totalPrice ?? order.total ?? 0).toFixed(2)}</Text>
              </View>

              {/* Delivery address */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Delivery Address</Text>
                <Text style={styles.itemText}>{order.deliveryAddress?.street}</Text>
                <Text style={styles.itemText}>{order.deliveryAddress?.city}, {order.deliveryAddress?.postcode}</Text>
                <Text style={styles.itemText}>{order.deliveryAddress?.country}</Text>
              </View>

              {/* Admin photo + approval */}
              {order.status === 'photo_review' && order.adminPhoto && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Admin Photo — Approve?</Text>
                  <Image source={{ uri: order.adminPhoto }} style={styles.photo} resizeMode="contain" />
                  <View style={styles.approvalRow}>
                    <TouchableOpacity style={[styles.approvalBtn, { backgroundColor: SV.green }]} onPress={() => handleApproval(true)}>
                      <Text style={styles.approvalBtnText}>✅ Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.approvalBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleApproval(false)}>
                      <Text style={styles.approvalBtnText}>❌ Deny</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Tracking */}
              {(order.status === 'shipped' || order.status === 'delivered') && (
                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.cardTitle}>Tracking</Text>
                    <TouchableOpacity onPress={loadTracking} disabled={trackingLoading}>
                      {trackingLoading
                        ? <ActivityIndicator size="small" color={SV.brown} />
                        : <Ionicons name="refresh-outline" size={18} color={SV.brown} />}
                    </TouchableOpacity>
                  </View>
                  {!tracking && <Text style={styles.itemText}>Tap refresh to load live tracking.</Text>}
                  {tracking?.message && <Text style={styles.itemText}>{tracking.message}</Text>}
                  {tracking?.delivery?.carrier && <Text style={styles.itemText}>Carrier: {tracking.delivery.carrier}</Text>}
                  {tracking?.cached && <Text style={[styles.itemText, { color: '#F97316' }]}>⚠️ Showing cached data</Text>}
                  {tracking?.delivery?.events?.map((ev, i) => (
                    <View key={i} style={styles.trackingEvent}>
                      <Text style={styles.trackingStatus}>{ev.status}</Text>
                      <Text style={styles.itemText}>{ev.location}</Text>
                      <Text style={styles.itemText}>{new Date(ev.timestamp).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              )}

              {messages.length > 0 && <Text style={styles.cardTitle}>Messages</Text>}
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.msgBubble, item.senderRole === 'admin' ? styles.msgAdmin : styles.msgUser]}>
              <Text style={styles.msgSender}>{item.sender?.name} ({item.senderRole})</Text>
              <Text style={styles.msgText}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.msgInputRow}>
              <TextInput
                style={styles.msgInput}
                placeholder="Send a message…"
                placeholderTextColor={SV.brown}
                value={msgText}
                onChangeText={setMsgText}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={sending}>
                <Ionicons name="send" size={18} color={SV.greenLight} />
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

export default function OrdersScreen() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersAPI.getAll(token);
      setOrders(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={SV.greenLight} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={48} color={SV.greenLight} />
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o._id}
          contentContainerStyle={{ padding: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={SV.greenLight} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.orderMeta}>{item.items?.length ?? 0} item(s) · €{(item.totalPrice ?? item.total ?? 0).toFixed(2)}</Text>
              <Text style={styles.orderMeta}>{item.deliveryAddress?.city}, {item.deliveryAddress?.postcode}</Text>
              {item.status === 'photo_review' && (
                <Text style={styles.actionNeeded}>⚠️ Photo waiting for your approval</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          token={token}
          onClose={() => setSelectedOrder(null)}
          onRefresh={fetchOrders}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SV.bg },
  header: { backgroundColor: SV.greenLight, borderRadius: 16, margin: 8, padding: 14 },
  headerTitle: { color: SV.brown, fontSize: 20, fontWeight: '700' },
  orderCard: {
    backgroundColor: SV.greenLight, borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 2, borderColor: SV.brown,
  },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderId: { color: SV.brown, fontWeight: '700', fontSize: 15 },
  orderMeta: { color: '#5a3010', fontSize: 13 },
  actionNeeded: { color: '#F97316', fontWeight: '700', fontSize: 13, marginTop: 4 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: SV.greenLight, fontWeight: '600' },
  // Detail modal
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SV.greenLight, padding: 14,
  },
  detailTitle: { flex: 1, color: SV.brown, fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: SV.sandybrown, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardTitle: { color: SV.brown, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  itemText: { color: '#5a3010', fontSize: 13, marginBottom: 2 },
  totalText: { color: SV.brown, fontWeight: '700', fontSize: 14, marginTop: 6 },
  photo: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  approvalRow: { flexDirection: 'row', gap: 10 },
  approvalBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  approvalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  trackingEvent: { backgroundColor: '#fff3', borderRadius: 8, padding: 8, marginBottom: 6 },
  trackingStatus: { color: SV.brown, fontWeight: '700', fontSize: 13 },
  msgBubble: { borderRadius: 10, padding: 10, marginBottom: 8, maxWidth: '80%' },
  msgAdmin: { backgroundColor: SV.sandybrown, alignSelf: 'flex-start' },
  msgUser: { backgroundColor: SV.brown, alignSelf: 'flex-end' },
  msgSender: { fontSize: 11, fontWeight: '700', color: SV.greenLight, marginBottom: 2 },
  msgText: { fontSize: 13, color: '#fff' },
  msgInputRow: { flexDirection: 'row', gap: 8, padding: 8, alignItems: 'center' },
  msgInput: {
    flex: 1, backgroundColor: SV.greenLight, borderRadius: 10,
    padding: 10, fontSize: 14, color: SV.brown,
  },
  sendBtn: { backgroundColor: SV.brown, borderRadius: 10, padding: 10 },
});
