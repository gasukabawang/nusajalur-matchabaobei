import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { apiService } from '../api/apiService';
import { PassDetail, WaypointProgress, CheckinResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CheckinScreenProps {
  route: any;
  navigation: any;
}

// Coordinate of Gedung Merdeka (Waypoint 1 in Braga Heritage) for testing simulation
const BANDUNG_DEMO_COORDS = {
  lat: -6.921130,
  lon: 107.609650,
  label: 'Gedung Merdeka & KAA (Bandung)',
};

export const CheckinScreen: React.FC<CheckinScreenProps> = ({ route, navigation }) => {
  const { passId, trailTitle } = route.params;
  const { t } = useLanguage();
  const [passData, setPassData] = useState<PassDetail | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<WaypointProgress | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [unlockedResult, setUnlockedResult] = useState<CheckinResult | null>(null);

  useEffect(() => {
    loadPassData();
    detectDeviceLocation();
  }, [passId]);

  const loadPassData = async () => {
    try {
      const trips = await apiService.getMyTrips();
      const p = trips.passes.find((item) => item.id === passId);
      if (p) {
        setPassData(p);
        // Default select first incomplete waypoint, or fallback to first
        const firstIncomplete = p.waypoints_progress.find((w) => !w.is_checked_in);
        setSelectedWaypoint(firstIncomplete || p.waypoints_progress[0]);
      }
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || t.checkin.loadError);
    } finally {
      setLoading(false);
    }
  };

  const detectDeviceLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCurrentCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    } catch {
      // Ignore location error, will fall back or let user toggle simulation
    }
  };

  const toggleSimulation = () => {
    if (!isSimulated) {
      setIsSimulated(true);
      setCurrentCoords({ lat: BANDUNG_DEMO_COORDS.lat, lon: BANDUNG_DEMO_COORDS.lon });
      Alert.alert('📍 Demo GPS Simulation ON', `Simulating presence at ${BANDUNG_DEMO_COORDS.label}`);
    } else {
      setIsSimulated(false);
      detectDeviceLocation();
      Alert.alert('📡 Real GPS Active', 'Reverted back to physical device sensor location.');
    }
  };

  const handlePerformCheckin = async () => {
    if (!selectedWaypoint || !currentCoords) {
      Alert.alert(t.auth.attention, 'Lokasi GPS belum terdeteksi. Silakan aktifkan GPS atau gunakan Mode Demo.');
      return;
    }

    setVerifying(true);
    try {
      const res = await apiService.performCheckin(passId, {
        waypoint_id: selectedWaypoint.waypoint_id,
        lat: currentCoords.lat,
        lon: currentCoords.lon,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUnlockedResult(res);
      await loadPassData(); // Refresh checklist & counts
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t.checkin.checkinFailed,
        err?.message || 'Anda belum berada dalam radius geofence pos budaya ini.'
      );
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {t.checkin.title}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={loadPassData}>
          <Ionicons name="refresh" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pass Info Header */}
        <View style={styles.passHeaderCard}>
          <Text style={styles.trailSubtitle}>{trailTitle}</Text>
          <Text style={styles.progressCounter}>
            {t.checkin.progressHeader}{' '}
            <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>
              {passData?.checked_in_count} {t.passes.of} {passData?.total_waypoints} {t.checkin.progressDone}
            </Text>
          </Text>
        </View>

        {/* GPS Simulation Banner */}
        <TouchableOpacity
          style={[styles.simBanner, isSimulated ? styles.simBannerActive : styles.simBannerNormal]}
          onPress={toggleSimulation}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isSimulated ? 'sparkles' : 'locate'}
            size={16}
            color={isSimulated ? Colors.amber : Colors.primary}
          />
          <Text style={styles.simBannerText}>
            {isSimulated ? t.checkin.simActive : t.checkin.simNormal}
          </Text>
        </TouchableOpacity>

        {/* Waypoint Selector Chips */}
        <Text style={styles.selectorLabel}>{t.checkin.targetWaypoint}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.waypointSelectorScroll}>
          {passData?.waypoints_progress.map((wp) => {
            const isSelected = selectedWaypoint?.waypoint_id === wp.waypoint_id;
            return (
              <TouchableOpacity
                key={wp.waypoint_id}
                style={[
                  styles.waypointChip,
                  isSelected && styles.waypointChipActive,
                  wp.is_checked_in && styles.waypointChipDone,
                ]}
                onPress={() => setSelectedWaypoint(wp)}
              >
                <View style={styles.chipRow}>
                  {wp.is_checked_in ? (
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  ) : (
                    <Text style={styles.chipSequence}>{wp.sequence}</Text>
                  )}
                  <Text
                    style={[
                      styles.chipName,
                      isSelected && styles.chipNameActive,
                      wp.is_checked_in && styles.chipNameDone,
                    ]}
                    numberOfLines={1}
                  >
                    {wp.waypoint_name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Radar Scanner View */}
        <View style={styles.radarCard}>
          <View style={styles.radarOuterRing}>
            <View style={styles.radarMiddleRing}>
              <View style={styles.radarCore}>
                <Ionicons name="compass" size={38} color={Colors.primary} />
              </View>
            </View>
          </View>

          <Text style={styles.activeWpName}>{selectedWaypoint?.waypoint_name}</Text>
          <Text style={styles.radiusRuleText}>
            {t.checkin.radarHint}
          </Text>

          {currentCoords && (
            <View style={styles.coordsBox}>
              <Text style={styles.coordsText}>
                {t.checkin.yourLocation}: {currentCoords.lat.toFixed(6)}, {currentCoords.lon.toFixed(6)}
              </Text>
            </View>
          )}

          {selectedWaypoint?.is_checked_in ? (
            <View style={styles.alreadyDoneBox}>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.primary} />
              <Text style={styles.alreadyDoneText}>{t.checkin.alreadyDone}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.checkinActionBtn}
              onPress={handlePerformCheckin}
              disabled={verifying}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryMid]}
                style={styles.checkinBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {verifying ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.checkinBtnText}>{t.checkin.verifying}</Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <Ionicons name="navigate-circle" size={20} color="#fff" />
                    <Text style={styles.checkinBtnText}>{t.checkin.checkinBtn}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Waypoints Status Checklist */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>{t.detail.waypoints}</Text>
          {passData?.waypoints_progress.map((wp) => (
            <View key={wp.waypoint_id} style={styles.checklistItem}>
              <View style={styles.checklistLeft}>
                <Ionicons
                  name={wp.is_checked_in ? 'checkbox' : 'ellipse-outline'}
                  size={20}
                  color={wp.is_checked_in ? Colors.primary : Colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.clWpName, wp.is_checked_in && styles.clWpNameDone]}>
                    {wp.sequence}. {wp.waypoint_name}
                  </Text>
                  {wp.is_checked_in && wp.voucher_code && (
                    <Text style={styles.clVoucherHint}>
                      🎁 Voucher: <Text style={{ fontWeight: 'bold' }}>{wp.voucher_code}</Text>
                    </Text>
                  )}
                </View>
              </View>

              {wp.is_checked_in && (
                <View style={styles.clBadgeDone}>
                  <Text style={styles.clBadgeDoneText}>{t.passes.voucherUnlocked}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Unlocked Reward Modal */}
      <Modal visible={!!unlockedResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryMid]}
              style={styles.modalHeaderGrad}
            >
              <Text style={{ fontSize: 36 }}>🏛️</Text>
              <Text style={styles.modalSuccessTitle}>{t.checkin.checkinSuccess}</Text>
              <Text style={styles.modalDistance}>
                Jarak terverifikasi: {unlockedResult?.distance_m} meter
              </Text>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.storyHeader}>📖 {t.checkin.story}:</Text>
              <Text style={styles.storyText}>{unlockedResult?.story_text}</Text>

              {unlockedResult?.voucher_code && (
                <View style={styles.voucherBox}>
                  <View style={styles.voucherTop}>
                    <Ionicons name="pricetags" size={20} color={Colors.amber} />
                    <Text style={styles.voucherTitle}>🎉 {t.checkin.voucher}</Text>
                  </View>
                  <Text style={styles.voucherDesc}>{unlockedResult?.voucher_description}</Text>
                  <View style={styles.voucherCodeContainer}>
                    <Text style={styles.voucherCodeText}>{unlockedResult?.voucher_code}</Text>
                  </View>
                  <Text style={styles.voucherFootnote}>
                    Tunjukkan kode ini kepada kasir UMKM untuk klaim potongan harga.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUnlockedResult(null)}
            >
              <Text style={styles.modalCloseText}>Lanjutkan Perjalanan 👟</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  passHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  trailSubtitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  progressCounter: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  simBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  simBannerNormal: {
    backgroundColor: Colors.primaryXPale,
    borderColor: Colors.primaryPale,
  },
  simBannerActive: {
    backgroundColor: Colors.amberLight,
    borderColor: Colors.amber + '44',
  },
  simBannerText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  selectorLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  waypointSelectorScroll: {
    marginBottom: 16,
  },
  waypointChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  waypointChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryXPale,
  },
  waypointChipDone: {
    borderColor: Colors.primaryLight,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipSequence: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  chipName: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 140,
  },
  chipNameActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  chipNameDone: {
    color: Colors.textPrimary,
  },
  radarCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  radarOuterRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surfaceSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radarMiddleRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryXPale,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeWpName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  radiusRuleText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  coordsBox: {
    backgroundColor: Colors.surfaceSage,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 16,
  },
  coordsText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  alreadyDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryXPale,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  alreadyDoneText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  checkinActionBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkinBtnGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  checklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checklistTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clWpName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  clWpNameDone: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  clVoucherHint: {
    color: Colors.amber,
    fontSize: 11,
    marginTop: 2,
  },
  clBadgeDone: {
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clBadgeDoneText: {
    color: Colors.amber,
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    overflow: 'hidden',
  },
  modalHeaderGrad: {
    padding: 24,
    alignItems: 'center',
  },
  modalSuccessTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  modalDistance: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  storyHeader: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  storyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  voucherBox: {
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.amber + '44',
    marginBottom: 10,
  },
  voucherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  voucherTitle: {
    color: Colors.amber,
    fontSize: 14,
    fontWeight: '800',
  },
  voucherDesc: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  voucherCodeContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.amber,
    alignItems: 'center',
    marginBottom: 8,
  },
  voucherCodeText: {
    color: Colors.amber,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  voucherFootnote: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  modalCloseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
