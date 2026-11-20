import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { apiService } from '../api/apiService';
import { PassDetail } from '../types';

interface MyPassesScreenProps {
  navigation: any;
}

export const MyPassesScreen: React.FC<MyPassesScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [passes, setPasses] = useState<PassDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // useFocusEffect: re-load every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadPasses();
    }, [])
  );

  const loadPasses = async () => {
    try {
      const trips = await apiService.getMyTrips();
      setPasses(trips.passes || []);
    } catch (err: any) {
      console.log('Error loading passes:', err);
      if (err?.code === 'INVALID_TOKEN' || err?.code === 'USER_NOT_FOUND' || err?.status === 401) {
        await logout();
        return;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPasses();
  };

  const renderPassCard = ({ item }: { item: PassDetail }) => {
    const isCompleted = item.status === 'COMPLETED' || item.checked_in_count === item.total_waypoints;
    const pct = Math.min(100, Math.max(0, item.completion_percentage));

    return (
      <View style={styles.card}>
        {/* Card Top Strip */}
        <LinearGradient
          colors={isCompleted ? [Colors.primary, Colors.primaryMid] : [Colors.primaryMid, Colors.primaryLight]}
          style={styles.cardStrip}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.stripLeft}>
            <View style={styles.ticketIcon}>
              <Text style={{ fontSize: 20 }}>🎟️</Text>
            </View>
            <View>
              <Text style={styles.stripTitle} numberOfLines={1}>{item.trail_title}</Text>
              <Text style={styles.stripDate}>
                {new Date(item.purchase_date).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isCompleted ? styles.badgeCompleted : styles.badgeActive]}>
            <Ionicons name={isCompleted ? 'checkmark-circle' : 'walk'} size={12} color="#fff" />
            <Text style={styles.badgeText}>
              {isCompleted ? t.passes.status.completed : t.passes.status.active}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{t.passes.progress}</Text>
              <Text style={styles.progressVal}>
                {item.checked_in_count} {t.passes.of} {item.total_waypoints} {t.passes.checkedIn} · {pct}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
            </View>
          </View>

          {/* Waypoint checklist */}
          <View style={styles.waypointList}>
            {item.waypoints_progress.map((wp) => (
              <View key={wp.waypoint_id} style={styles.wpRow}>
                <View style={[styles.wpDot, wp.is_checked_in ? styles.wpDotDone : styles.wpDotPending]}>
                  <Ionicons
                    name={wp.is_checked_in ? 'checkmark' : 'location-outline'}
                    size={10}
                    color={wp.is_checked_in ? '#fff' : Colors.textMuted}
                  />
                </View>
                <Text style={[styles.wpName, wp.is_checked_in && styles.wpNameDone]} numberOfLines={1}>
                  {wp.waypoint_name}
                </Text>
                {wp.is_checked_in && wp.voucher_code && (
                  <View style={styles.voucherTag}>
                    <Ionicons name="pricetag" size={10} color={Colors.amber} />
                    <Text style={styles.voucherText}>Voucher</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.actionBtn, isCompleted && styles.actionBtnDone]}
            onPress={() => navigation.navigate('Checkin', { passId: item.id, trailTitle: item.trail_title })}
            activeOpacity={0.85}
          >
            <Ionicons name={isCompleted ? 'trophy' : 'location'} size={16} color={isCompleted ? Colors.amber : '#fff'} />
            <Text style={[styles.actionBtnText, isCompleted && styles.actionBtnTextDone]}>
              {isCompleted ? 'Buka Riwayat & Voucher 🏆' : t.passes.startCheckin}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Colors.background, Colors.backgroundAlt]} style={styles.header}>
        <Text style={styles.headerTitle}>{t.passes.title} 🎟️</Text>
        <Text style={styles.headerSub}>{t.passes.subtitle}</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingBox}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🎫</Text>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t.passes.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={passes}
          keyExtractor={(item) => item.id}
          renderItem={renderPassCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyEmoji}>🗺️</Text>
              </View>
              <Text style={styles.emptyTitle}>{t.passes.empty}</Text>
              <Text style={styles.emptySub}>{t.passes.emptyDesc}</Text>
              {/* BUG FIX: was 'Home', correct tab name is 'ExploreTab' */}
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('ExploreTab')}
                activeOpacity={0.85}
              >
                <LinearGradient colors={[Colors.primary, Colors.primaryMid]} style={styles.exploreBtnGrad}>
                  <Ionicons name="compass" size={16} color="#fff" />
                  <Text style={styles.exploreBtnText}>{t.passes.exploreBtn}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },

  listContent: { padding: 20, paddingBottom: 100, gap: 16 },

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
  cardStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ticketIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  stripTitle: { fontSize: 14, fontWeight: '800', color: '#fff', maxWidth: 160 },
  stripDate: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  badgeCompleted: { backgroundColor: 'rgba(0,0,0,0.20)' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  cardBody: { padding: 16 },

  // Progress
  progressSection: { marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  progressVal: { fontSize: 11, color: Colors.textMuted },
  progressTrack: {
    height: 8, borderRadius: 4, backgroundColor: Colors.primaryXPale, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 4, backgroundColor: Colors.primary,
  },

  // Waypoints
  waypointList: { gap: 8, marginBottom: 16 },
  wpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wpDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  wpDotDone: { backgroundColor: Colors.primary },
  wpDotPending: { backgroundColor: Colors.borderLight, borderWidth: 1.5, borderColor: Colors.border },
  wpName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  wpNameDone: { color: Colors.textPrimary, fontWeight: '600' },
  voucherTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  voucherText: { fontSize: 10, color: Colors.amber, fontWeight: '700' },

  // Action
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 46, borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  actionBtnDone: { backgroundColor: Colors.amberLight },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  actionBtnTextDone: { color: Colors.amber },

  // Loading
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  // Empty
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryXPale,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
  exploreBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  exploreBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  exploreBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
