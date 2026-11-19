import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Colors } from '../theme/colors';
import { apiService } from '../api/apiService';
import { Trail } from '../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

const THEME_DATA = [
  { id: 'all', emoji: '✨', labelKey: 'allTrails' },
  { id: 'heritage', emoji: '🏛️', labelKey: 'heritage' },
  { id: 'kuliner', emoji: '🍜', labelKey: 'kuliner' },
  { id: 'alam', emoji: '🌲', labelKey: 'alam' },
  { id: 'arsitektur', emoji: '📐', labelKey: 'arsitektur' },
  { id: 'sejarah', emoji: '⚔️', labelKey: 'sejarah' },
] as const;

const TRAIL_EMOJIS: Record<string, string> = {
  heritage: '🏛️', kuliner: '🍜', alam: '🌲',
  arsitektur: '📐', sejarah: '⚔️', default: '🗺️',
};

const TRAIL_COLORS: Record<string, string[]> = {
  heritage: ['#5B9E7B', '#3D7A5F'],
  kuliner: ['#D97706', '#C2673A'],
  alam: ['#3D7A5F', '#2E6B4F'],
  arsitektur: ['#2E86AB', '#1A6B8A'],
  sejarah: ['#C2673A', '#A0522D'],
  default: ['#5B9E7B', '#3D7A5F'],
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    fetchTrails();
    detectLocation();
  }, [selectedTheme]);

  const detectLocation = async () => {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
        fetchTrails({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    } catch {
      // proceed without location
    } finally {
      setGpsLoading(false);
    }
  };

  const fetchTrails = async (coords?: { lat: number; lon: number }) => {
    try {
      const activeCoords = coords || userCoords;
      const res = await apiService.getTrails({
        theme: selectedTheme === 'all' ? undefined : selectedTheme,
        lat: activeCoords?.lat,
        lon: activeCoords?.lon,
      });
      setTrails(res.trails);
    } catch (err) {
      console.log('Error fetching trails:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrails();
  };

  const formatPrice = (price: number) => {
    if (price === 0) return t.home.free;
    return t.common.idr + ' ' + price.toLocaleString('id-ID');
  };

  const getThemeLabel = (labelKey: string): string => {
    const map: Record<string, string> = {
      allTrails: t.home.allTrails,
      heritage: t.home.heritage,
      kuliner: t.home.kuliner,
      alam: t.home.alam,
      arsitektur: t.home.arsitektur,
      sejarah: t.home.sejarah,
    };
    return map[labelKey] || labelKey;
  };

  const renderTrailCard = ({ item, index }: { item: Trail; index: number }) => {
    const themeEmoji = TRAIL_EMOJIS[item.theme] || TRAIL_EMOJIS.default;
    const themeColors = TRAIL_COLORS[item.theme] || TRAIL_COLORS.default;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TrailDetail', { trailId: item.id })}
        activeOpacity={0.90}
      >
        {/* Card Top — Illustrated Banner */}
        <LinearGradient colors={themeColors} style={styles.cardBanner}>
          {/* Deco circles */}
          <View style={styles.bannerCircle1} />
          <View style={styles.bannerCircle2} />

          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <View style={styles.themeEmojiBox}>
                <Text style={styles.themeEmoji}>{themeEmoji}</Text>
              </View>
              <View style={styles.themePill}>
                <Text style={styles.themePillText}>{item.theme.toUpperCase()}</Text>
              </View>
            </View>
            {item.distance_from_user_km !== null && item.distance_from_user_km !== undefined && (
              <View style={styles.distancePill}>
                <Ionicons name="navigate" size={11} color="#fff" />
                <Text style={styles.distancePillText}>{item.distance_from_user_km} km</Text>
              </View>
            )}
          </View>

          {/* Large emoji decorative */}
          <Text style={styles.bannerBgEmoji}>{themeEmoji}</Text>
        </LinearGradient>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.locationText}>{t.home.bandung}</Text>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

          {/* Metrics row */}
          <View style={styles.metricsRow}>
            <MetricChip icon="walk-outline" value={`${item.distance_km} ${t.home.distance}`} color={Colors.primary} />
            <MetricChip icon="time-outline" value={`${item.est_duration_min} ${t.home.duration}`} color={Colors.sky} />
            <MetricChip icon="flame-outline" value={`${item.est_kcal} ${t.home.kcal}`} color={Colors.amber} />
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.curatorRow}>
              <View style={styles.curatorDot} />
              <Text style={styles.curatorName} numberOfLines={1}>
                {t.home.curatedBy}: {item.curator?.name || '-'}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceText}>{formatPrice(item.price_idr)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Teman';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Colors.background, Colors.backgroundAlt]} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>🧭</Text>
            </View>
            <View>
              <Text style={styles.greetText}>{t.home.greeting}, {firstName} 👋</Text>
              <Text style={styles.locationLabel}>
                <Ionicons name="location" size={12} color={Colors.primaryMid} /> {t.home.bandung}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.gpsBtn, userCoords && styles.gpsBtnActive]}
            onPress={detectLocation}
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={userCoords ? 'location' : 'location-outline'}
                  size={16}
                  color={userCoords ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.gpsBtnText, userCoords && styles.gpsBtnTextActive]}>
                  {userCoords ? t.home.locationOn : t.home.locationOff}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>{t.home.subtitle}</Text>

        {/* Theme Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {THEME_DATA.map((theme) => {
            const isActive = selectedTheme === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedTheme(theme.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipEmoji}>{theme.emoji}</Text>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {getThemeLabel(theme.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Trails Count */}
      {!loading && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {trails.length} {t.home.trailsFound}
          </Text>
          {userCoords && (
            <View style={styles.nearbyBadge}>
              <Ionicons name="navigate" size={11} color={Colors.primary} />
              <Text style={styles.nearbyText}>{t.home.nearbyLabel}</Text>
            </View>
          )}
        </View>
      )}

      {/* Trail List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <View style={styles.loadingIcon}>
            <Text style={{ fontSize: 32 }}>🗺️</Text>
          </View>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.loadingText}>{t.home.loadingTrails}</Text>
        </View>
      ) : (
        <FlatList
          data={trails}
          keyExtractor={(item) => item.id}
          renderItem={renderTrailCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>{t.home.noTrails}</Text>
              <Text style={styles.emptySub}>{t.home.noTrailsSub}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// Small metric chip component
const MetricChip = ({ icon, value, color }: { icon: any; value: string; color: string }) => (
  <View style={[metricStyles.chip, { borderColor: color + '30', backgroundColor: color + '10' }]}>
    <Ionicons name={icon} size={12} color={color} />
    <Text style={[metricStyles.text, { color }]}>{value}</Text>
  </View>
);
const metricStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
    marginRight: 6,
  },
  text: { fontSize: 11, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  greetText: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  locationLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  gpsBtnActive: { borderColor: Colors.primaryPale, backgroundColor: Colors.primaryXPale },
  gpsBtnText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  gpsBtnTextActive: { color: Colors.primary },

  subtitle: {
    fontSize: 20, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: 14,
  },

  // Theme chips
  filterRow: { paddingBottom: 4, gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },

  // Count bar
  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  countText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  nearbyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryXPale, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  nearbyText: { fontSize: 11, fontWeight: '600', color: Colors.primary },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 16 },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardBanner: {
    height: 120,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  bannerCircle1: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.10)',
    right: -20, top: -20,
  },
  bannerCircle2: {
    position: 'absolute', width: 60, height: 60,
    borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)',
    left: -15, bottom: -15,
  },
  bannerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeEmojiBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  themeEmoji: { fontSize: 18 },
  themePill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  themePillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  distancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.20)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  distancePillText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bannerBgEmoji: {
    position: 'absolute', right: 16, bottom: 10,
    fontSize: 56, opacity: 0.18,
  },

  // Card body
  cardBody: { padding: 14 },
  cardTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  locationText: { fontSize: 11, color: Colors.textMuted },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },

  metricsRow: { flexDirection: 'row', marginBottom: 12 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  curatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  curatorDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primaryLight,
  },
  curatorName: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  priceBox: {
    backgroundColor: Colors.primaryXPale,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  priceText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  // Loading
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryXPale,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  loadingText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  // Empty
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
});
