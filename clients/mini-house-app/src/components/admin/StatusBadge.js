import { StyleSheet, Text, View } from 'react-native';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getThemeColors } from '../../config/theme';

const StatusBadge = ({ status = 'pending', type = 'order' }) => {
  const { restaurant } = useRestaurant();
  const theme = getThemeColors(restaurant);
  
  const map = {
  // Contact messages
  new: { label: 'Nouveau', color: '#6366f1' },
  read: { label: 'Lu', color: '#60a5fa' },
  archived: { label: 'Archivé', color: theme.text.tertiary },
  // Reviews
  approved: { label: 'Approuvé', color: theme.success },
  rejected: { label: 'Rejeté', color: theme.error },
  // Orders - Chaque statut a une couleur distincte et bien différenciée
  // Note: 'pending' est géré dans la fonction selon le type (order/review)
  confirmed: { label: 'Confirmée', color: '#2563eb' }, // Bleu foncé/vif - confirmée (bien différencié de l'orange)
  preparing: { label: 'Préparation', color: '#eab308' }, // Jaune doré - en préparation
  ready: { label: 'Prête', color: theme.success }, // Vert - prête à récupérer
  on_delivery: { label: 'En livraison', color: '#06b6d4' }, // Cyan - en route
  cancelled: { label: 'Annulée', color: theme.error }, // Rouge - annulée
  rejected: { label: 'Refusée', color: theme.error }, // Rouge - refusée par le restaurant
  };
  
  let s = map[status];
  
  // Gestion spéciale pour 'pending' selon le type (review ou order)
  if (status === 'pending' && type === 'order') {
    s = { label: 'En attente', color: theme.warning }; // Orange/Ambre vif pour commandes en attente (bien différencié du bleu)
  } else if (status === 'pending' && type === 'review') {
    s = { label: 'En attente', color: '#a78bfa' }; // Violet pour reviews en attente
  } else if (status === 'completed') {
    s = { label: 'Livrée', color: theme.primary }; // Utiliser theme.primary pour completed
  }
  
  if (!s) {
    s = { label: status, color: theme.text.tertiary };
  }
  
  return (
    <View style={[styles.badge, { backgroundColor: s.color + '22', borderColor: s.color }]}>
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700' },
});

export default StatusBadge;
