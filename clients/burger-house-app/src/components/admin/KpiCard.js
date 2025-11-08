import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const KpiCard = ({ title, value, icon, color = '#22c55e', onPress, subtitle, trend }) => {
  // trend: { value: number, percentage: number } ou null
  const getTrendIcon = () => {
    if (!trend || trend.percentage === 0) return null;
    return trend.percentage > 0 ? 'trending-up' : 'trending-down';
  };

  const getTrendColor = () => {
    if (!trend || trend.percentage === 0) return 'theme.text.tertiary';
    return trend.percentage > 0 ? '#22c55e' : 'theme.error';
  };

  const formatTrend = () => {
    if (!trend || trend.percentage === 0) return null;
    const sign = trend.percentage > 0 ? '+' : '';
    return `${sign}${trend.percentage.toFixed(1)}%`;
  };

  const trendIcon = getTrendIcon();
  const trendColor = getTrendColor();
  const trendText = formatTrend();

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.card, { borderColor: color }] }>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }] }>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {trendIcon && trendText && (
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
              <MaterialIcons name={trendIcon} size={14} color={trendColor} />
              <Text style={[styles.trendText, { color: trendColor }]}>{trendText}</Text>
            </View>
          )}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'theme.background.white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'theme.background.border',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  title: { color: 'theme.text.secondary', fontSize: 12 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  value: { fontSize: 20, fontWeight: '800' },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: { fontSize: 11, fontWeight: '700' },
  subtitle: { color: 'theme.text.tertiary', fontSize: 12, marginTop: 2 },
});

export default KpiCard;
