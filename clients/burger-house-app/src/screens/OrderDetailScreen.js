import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import StatusBadge from '../components/admin/StatusBadge';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { orderService } from '../services/orderService';

const OrderDetailScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const { count } = useCart();
  const { logout } = useAuth();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (e) {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <View style={styles.mainContainer}>
      <Header
        onCart={() => navigation.navigate('Cart')}
        cartCount={count}
        notifications={notifications}
        notificationCount={notificationCount}
        onDeleteNotification={(notificationId) => {
          console.log('🗑️ OrderDetailScreen - Suppression de notification:', notificationId);
          if (clearNotification) {
            clearNotification(notificationId);
          }
        }}
        onNotificationPress={(notif) => {
          console.log('🔔 OrderDetailScreen - Clic sur notification:', notif);
          // Marquer la notification comme lue
          if (notif.id && markAsRead) {
            markAsRead(notif.id);
          }
          if (notif.orderId) {
            // Naviguer vers la page de commandes avec l'orderId en paramètre
            navigation?.navigate('Orders', { orderId: notif.orderId });
          } else {
            navigation?.navigate('Orders');
          }
        }}
        onNotifications={() => {
          console.log('🔔 OrderDetailScreen - onNotifications appelé (fallback)');
          navigation?.navigate('Orders');
        }}
        onProfile={() => navigation?.navigate('Profile')}
        onLogout={logout}
        showCart={true}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loader}><ActivityIndicator color="#22c55e" /></View>
        ) : order ? (
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.title}>Commande #{order.orderNumber}</Text>
              <StatusBadge status={order.status} type="order" />
            </View>
            <Text style={styles.sub}>{new Date(order.createdAt).toLocaleString()}</Text>
            <View style={styles.itemsBox}>
              {Array.isArray(order.items) && order.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemQty}>x{it.quantity || 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{it.name || 'Article'}</Text>
                    {it.options && (
                      <Text style={styles.itemOpts}>
                        {(() => {
                          const acc = Array.isArray(it.options.accompagnements) ? it.options.accompagnements : [];
                          const drink = it.options.boisson ? ` • Boisson: ${it.options.boisson}` : '';
                          const accStr = acc.length ? `Accompagnements: ${acc.join(', ')}` : '';
                          return `${accStr}${drink}`.replace(/^\s+|\s+$/g, '');
                        })()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>{Number(it.price || it.unitPrice || 0).toFixed(2)} €</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalsBox}>
              <Row label="Sous-total" value={`${Number(order.subtotal||0).toFixed(2)} €`} />
              <Row label="Frais de livraison" value={`${Number(order.deliveryFee||0).toFixed(2)} €`} />
              <Row label="Taxes" value={`${Number(order.tax||0).toFixed(2)} €`} />
              <Row label="Total" value={`${Number(order.total||0).toFixed(2)} €`} strong />
            </View>
          </View>
        ) : (
          <View style={styles.loader}><Text style={{ color: '#333' }}>Commande introuvable</Text></View>
        )}
        <Footer onContact={() => navigation?.navigate('Contact')} />
      </ScrollView>
    </View>
  );
};

const Row = ({ label, value, strong }) => (
  <View style={styles.row}> 
    <Text style={[styles.rowLabel, strong && { fontWeight: '800' }]}>{label}</Text>
    <Text style={[styles.rowValue, strong && { color: '#22c55e' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f5f5', flexDirection: 'column' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1 },
  loader: { padding: 40, alignItems: 'center' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 6 },
  sub: { color: '#666', marginBottom: 10 },
  itemsBox: { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#eee' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  itemQty: { color: '#333', width: 26, fontWeight: '700' },
  itemName: { color: '#333', fontWeight: '700' },
  itemOpts: { color: '#666', fontSize: 12 },
  itemPrice: { color: '#22c55e', fontWeight: '700', minWidth: 70, textAlign: 'right' },
  totalsBox: { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#eee', marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { color: '#555' },
  rowValue: { color: '#333', fontWeight: '700' },
});

export default OrderDetailScreen;
