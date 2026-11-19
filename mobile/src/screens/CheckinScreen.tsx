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
        // Default to first unchecked waypoint
        const firstUnchecked = p.waypoints_progress.find((w) => !w.is_checked_in) || p.waypoints_progress[0];
        setSelectedWaypoint(firstUnchecked);
      }
    } catch (err: any) {
      console.log('Error loading pass:', err);
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
        setIsSimulated(false);
      } else {
        // Fallback to demo coordinate if permission denied
        setCurrentCoords(BANDUNG_DEMO_COORDS);
        setIsSimulated(true);
      }
    } catch {
      setCurrentCoords(BANDUNG_DEMO_COORDS);
      setIsSimulated(true);
    }
  };

  const toggleSimulation = () => {
    if (!isSimulated) {
      setCurrentCoords(BANDUNG_DEMO_COORDS);
      setIsSimulated(true);
      Alert.alert('📍 Mode Simulasi Aktif', 'Koordinat diubah ke Gedung Merdeka Bandung (-6.921130, 107.609650) untuk pengujian check-in.');
    } else {
      detectDeviceLocation();
    }
  };

  const handlePerformCheckin = async () => {
    if (!selectedWaypoint || !currentCoords) {
      Alert.alert('Perhatian', 'Menunggu koordinat GPS terdeteksi...');
      return;
    }

    setVerifying(true);
    try {
      const res = await apiService.verifyCheckin(passId, {
        waypoint_id: selectedWaypoint.waypoint_id,
        user_lat: currentCoords.lat,
        user_lon: currentCoords.lon,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUnlockedResult(res);
      loadPassData(); // Refresh progress
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Check-in Belum Berhasil', err?.message || 'Anda belum berada di dalam radius pos ini.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Menghubungkan sensor radar GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Radar GPS Check-in
        </Text>
        <TouchableOpacity style={styles.navButton} onPress={toggleSimulation}>
          <Ionicons
            name={isSimulated ? 'pin' : 'pin-outline'}
            size={18}
            color={isSimulated ? Colors.amber : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Pass Header */}
        <View style={styles.passHeaderCard}>
          <Text style={styles.trailTitle}>{trailTitle || passData?.trail_title}</Text>
          <Text style={styles.passProgressText}>
            Progres Pos:{' '}
            <Text style={{ color: Colors.primaryLight, fontWeight: 'bold' }}>
              {passData?.checked_in_count} dari {passData?.total_waypoints} Selesai
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
            {isSimulated
              ? 'Mode Demo: Terhubung ke Gedung Merdeka Bandung'
              : 'GPS Fisik HP: Ketuk untuk simulasi lokasi Bandung'}
          </Text>
        </TouchableOpacity>

        {/* Waypoint Selector Chips */}
        <Text style={styles.selectorLabel}>PILIH TITIK POS TUJUAN:</Text>
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
            Toleransi Jarak Geofence: Radius 50 meter
          </Text>

          {currentCoords && (
            <View style={styles.coordsBox}>
              <Text style={styles.coordsText}>
                Koordinat Anda: {currentCoords.lat.toFixed(6)}, {currentCoords.lon.toFixed(6)}
              </Text>
            </View>
          )}

          {selectedWaypoint?.is_checked_in ? (
            <View style={styles.alreadyDoneBox}>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.primary} />
              <Text style={styles.alreadyDoneText}>Pos ini sudah selesai di-check-in!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.checkinActionBtn}
              onPress={handlePerformCheckin}
              disabled={verifying}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[Colors.primaryLight, Colors.primary]}
                style={styles.checkinBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {verifying ? (
                  <ActivityIndicator color="#090D16" />
                ) : (
                  <>
                    <Ionicons name="scan-circle" size={20} color="#090D16" style={{ marginRight: 8 }} />
                    <Text style={styles.checkinBtnText}>Verifikasi GPS Check-in 📍</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Story & Voucher Result Modal */}
        <Modal visible={unlockedResult !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.unlockModalCard}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.2)', 'transparent']}
                style={styles.unlockModalHeader}
              >
                <View style={styles.trophyIcon}>
                  <Ionicons name="ribbon" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.unlockTitle}>Check-in GPS Berhasil! 🎉</Text>
                <Text style={styles.unlockSub}>{unlockedResult?.waypoint_name}</Text>
              </LinearGradient>

              <ScrollView style={styles.unlockBody} showsVerticalScrollIndicator={false}>
                {/* Historical Story Box */}
                <View style={styles.storyBox}>
                  <View style={styles.storyHeader}>
                    <Ionicons name="book-outline" size={16} color={Colors.primary} />
                    <Text style={styles.storyHeaderTitle}>Narasi Sejarah Terbuka</Text>
                  </View>
                  <Text style={styles.storyBodyText}>{unlockedResult?.story_text}</Text>
                </View>

                {/* UMKM Voucher Box */}
                <View style={styles.voucherBox}>
                  <View style={styles.voucherHeader}>
                    <Ionicons name="pricetag" size={16} color={Colors.amber} />
                    <Text style={styles.voucherHeaderTitle}>
                      Voucher Mitra: {unlockedResult?.umkm_name}
                    </Text>
                  </View>
                  <Text style={styles.voucherDescText}>{unlockedResult?.voucher_desc}</Text>

                  <View style={styles.voucherCodeContainer}>
                    <Text style={styles.voucherCodeLabel}>KODE VOUCHER:</Text>
                    <Text style={styles.voucherCodeVal}>{unlockedResult?.voucher_code}</Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.closeUnlockBtn}
                onPress={() => setUnlockedResult(null)}
              >
                <Text style={styles.closeUnlockText}>Tutup & Lanjutkan Jalan 🚶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  passHeaderCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  trailTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  passProgressText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  simBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    gap: 8,
  },
  simBannerNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: Colors.borderActive,
  },
  simBannerActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
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
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  waypointSelectorScroll: {
    marginBottom: 16,
  },
  waypointChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  waypointChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  waypointChipDone: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipSequence: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 140,
  },
  chipNameActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  chipNameDone: {
    color: Colors.textPrimary,
  },
  radarCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  radarOuterRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  radarMiddleRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarCore: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  activeWpName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  radiusRuleText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  coordsBox: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 20,
  },
  coordsText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  checkinActionBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkinBtnGradient: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkinBtnText: {
    color: '#090D16',
    fontSize: 15,
    fontWeight: '800',
  },
  alreadyDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  alreadyDoneText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  unlockModalCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderActive,
    maxHeight: '85%',
  },
  unlockModalHeader: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  trophyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  unlockTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  unlockSub: {
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  unlockBody: {
    marginVertical: 12,
  },
  storyBox: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  storyHeaderTitle: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  storyBodyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  voucherBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  voucherHeaderTitle: {
    color: Colors.amber,
    fontSize: 13,
    fontWeight: '700',
  },
  voucherDescText: {
    color: Colors.textPrimary,
    fontSize: 12,
    marginBottom: 10,
  },
  voucherCodeContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.amber,
  },
  voucherCodeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  voucherCodeVal: {
    color: Colors.amber,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  closeUnlockBtn: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  closeUnlockText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
