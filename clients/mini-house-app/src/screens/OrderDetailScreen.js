import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import StatusBadge from '../components/admin/StatusBadge';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getThemeColors } from '../config/theme';
import { orderService } from '../services/orderService';

const OrderDetailScreen = ({ route, navigation }) => {
  const { id } = route.params || {};
  const { count } = useCart();
  const { logout } = useAuth();
  const { notifications, notificationCount, onNotificationPress, markAsRead, clearNotification } = useNotifications();
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
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
    <View style={[styles.mainContainer, { backgroundColor: theme.background.light }]}>
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

      <ScrollView style={[styles.container, { backgroundColor: theme.background.light }]} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loader}><ActivityIndicator color={theme.primary} /></View>
        ) : order ? (
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[styles.title, { color: theme.text.primary }]}>Commande #{order.orderNumber}</Text>
              <StatusBadge status={order.status} type="order" />
            </View>
            <Text style={[styles.sub, { color: (theme.text.secondary || '#666') }]}>{new Date(order.createdAt).toLocaleString()}</Text>
            <View style={[styles.itemsBox, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
              {Array.isArray(order.items) && order.items.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={[styles.itemQty, { color: theme.text.primary }]}>x{it.quantity || 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text.primary }]}>{it.name || 'Article'}</Text>
                    {it.options && (
                      <Text style={[styles.itemOpts, { color: (theme.text.secondary || '#666') }]}>
                        {(() => {
                          const acc = Array.isArray(it.options.accompagnements) ? it.options.accompagnements : [];
                          const drink = it.options.boisson ? ` • Boisson: ${it.options.boisson}` : '';
                          const accStr = acc.length ? `Accompagnements: ${acc.join(', ')}` : '';
                          return `${accStr}${drink}`.replace(/^\s+|\s+$/g, '');
                        })()}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.itemPrice, { color: theme.primary }]}>{Number(it.price || it.unitPrice || 0).toFixed(2)} €</Text>
                </View>
              ))}
            </View>

            <View style={[styles.totalsBox, { backgroundColor: (theme.background.white || '#fff'), borderColor: theme.background.border }]}>
              <Row label="Sous-total" value={`${Number(order.subtotal||0).toFixed(2)} €`} theme={theme} />
              <Row label="Frais de livraison" value={`${Number(order.deliveryFee||0).toFixed(2)} €`} theme={theme} />
              <Row label="Taxes" value={`${Number(order.tax||0).toFixed(2)} €`} theme={theme} />
              <Row label="Total" value={`${Number(order.total||0).toFixed(2)} €`} strong theme={theme} />
            </View>
          </View>
        ) : (
          <View style={styles.loader}><Text style={{ color: theme.text.primary }}>Commande introuvable</Text></View>
        )}
        <Footer onContact={() => navigation?.navigate('Contact')} />
      </ScrollView>
    </View>
  );
};

const Row = ({ label, value, strong, theme }) => (
  <View style={styles.row}> 
    <Text style={[styles.rowLabel, strong && { fontWeight: '800' }]}>{label}</Text>
    <Text style={[styles.rowValue, strong && { color: theme.primary }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'column' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  loader: { padding: 40, alignItems: 'center' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sub: { marginBottom: 10 },
  itemsBox: { borderRadius: 10, padding: 10, borderWidth: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  itemQty: { width: 26, fontWeight: '700' },
  itemName: { fontWeight: '700' },
  itemOpts: { fontSize: 12 },
  itemPrice: { fontWeight: '700', minWidth: 70, textAlign: 'right' },
  totalsBox: { borderRadius: 10, padding: 10, borderWidth: 1, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { color: '#555' },
  rowValue: { fontWeight: '700' },
});

export default OrderDetailScreen;
