import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { apiService } from '../api/apiService';
import { Trail, PricingCalculation } from '../types';

interface TrailDetailScreenProps {
  route: any;
  navigation: any;
}

export const TrailDetailScreen: React.FC<TrailDetailScreenProps> = ({ route, navigation }) => {
  const { trailId } = route.params;
  const [trail, setTrail] = useState<Trail | null>(null);
  const [pricing, setPricing] = useState<PricingCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitTime, setVisitTime] = useState('07:00'); // Default to off-peak morning
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    loadData();
  }, [trailId, visitTime]);

  const loadData = async () => {
    try {
      const [tData, pData] = await Promise.all([
        apiService.getTrailDetail(trailId),
        apiService.getTrailPricing(trailId, visitTime),
      ]);
      setTrail(tData);
      setPricing(pData);
    } catch (err: any) {
      Alert.alert('Gagal Memuat Rute', err?.message || 'Tidak dapat mengambil detail rute.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePass = async () => {
    setBuying(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newPass = await apiService.purchasePass({
        trail_id: trailId,
        visit_time: visitTime,
      });

      setShowCheckoutModal(false);
      Alert.alert(
        '🎉 Tiket Berhasil Dibeli!',
        `Digital Pass untuk "${trail?.title}" aktif. Bagi hasil: 70% voucher UMKM, 15% kurator, 15% platform.`,
        [
          {
            text: 'Mulai Jalan Sekarang',
            onPress: () => navigation.navigate('Checkin', { passId: newPass.id, trailTitle: trail?.title }),
          },
          {
            text: 'Lihat Tiket Saya',
            onPress: () => navigation.navigate('MyPasses'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Gagal Membeli Pass', err?.message || 'Terjadi kesalahan sistem transaksi.');
    } finally {
      setBuying(false);
    }
  };

  if (loading || !trail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan peta rute budaya...</Text>
      </View>
    );
  }

  const formatPrice = (price: number) => 'Rp ' + price.toLocaleString('id-ID');

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Detail Rute
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.themeRow}>
            <View style={styles.themePill}>
              <Text style={styles.themePillText}>{trail.theme.toUpperCase()}</Text>
            </View>
            <View style={styles.cityPill}>
              <Ionicons name="location-sharp" size={12} color={Colors.sky} />
              <Text style={styles.cityPillText}>{trail.city}</Text>
            </View>
          </View>

          <Text style={styles.trailTitle}>{trail.title}</Text>
          <Text style={styles.trailDesc}>{trail.description}</Text>

          {/* Metric Badges */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Ionicons name="walk" size={18} color={Colors.primary} />
              <Text style={styles.metricBig}>{trail.distance_km} km</Text>
              <Text style={styles.metricLabel}>Jarak Tempuh</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="time" size={18} color={Colors.sky} />
              <Text style={styles.metricBig}>{trail.est_duration_min} mnt</Text>
              <Text style={styles.metricLabel}>Durasi Jalan</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="flame" size={18} color={Colors.amber} />
              <Text style={styles.metricBig}>{trail.est_kcal}</Text>
              <Text style={styles.metricLabel}>Kalori Bakar</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="footsteps" size={18} color={Colors.accent} />
              <Text style={styles.metricBig}>{trail.est_steps.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Langkah Kaki</Text>
            </View>
          </View>
        </View>

        {/* Curator Profile */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Kurator Budaya Lokal</Text>
          <View style={styles.curatorCard}>
            <Image source={{ uri: trail.curator.avatar_url }} style={styles.curatorBigAvatar} />
            <View style={styles.curatorDetails}>
              <View style={styles.curatorNameRow}>
                <Text style={styles.curatorBigName}>{trail.curator.name}</Text>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.curatorBadgeTag}>{trail.curator.badge || 'Kurator Tersertifikasi'}</Text>
              <Text style={styles.curatorBioText}>{trail.curator.bio}</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Pricing Selector */}
        <View style={styles.sectionCard}>
          <View style={styles.pricingHeaderRow}>
            <Text style={styles.sectionTitle}>Simulasi Harga Dinamis</Text>
            <View style={styles.offPeakDiscountTag}>
              <Ionicons name="sparkles" size={12} color={Colors.amber} />
              <Text style={styles.offPeakDiscountText}>Diskon 20% Pagi</Text>
            </View>
          </View>
          <Text style={styles.pricingSub}>
            Pilih rencana waktu kunjungan untuk melihat kalkulasi harga tiket pintar:
          </Text>

          <View style={styles.timeOptionRow}>
            <TouchableOpacity
              style={[
                styles.timeOptionBtn,
                visitTime === '07:00' && styles.timeOptionBtnActive,
              ]}
              onPress={() => setVisitTime('07:00')}
            >
              <Ionicons
                name="sunny"
                size={16}
                color={visitTime === '07:00' ? Colors.amber : Colors.textMuted}
              />
              <Text
                style={[
                  styles.timeOptionText,
                  visitTime === '07:00' && styles.timeOptionTextActive,
                ]}
              >
                07:00 WIB (Pagi)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeOptionBtn,
                visitTime === '11:00' && styles.timeOptionBtnActive,
              ]}
              onPress={() => setVisitTime('11:00')}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={visitTime === '11:00' ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.timeOptionText,
                  visitTime === '11:00' && styles.timeOptionTextActive,
                ]}
              >
                11:00 WIB (Normal)
              </Text>
            </TouchableOpacity>
          </View>

          {pricing && (
            <View style={styles.pricingReceipt}>
              <View style={styles.receiptLine}>
                <Text style={styles.receiptLabel}>Tiket Dasar Rute</Text>
                <Text style={styles.receiptVal}>{formatPrice(pricing.base_trail_price_idr)}</Text>
              </View>
              <View style={styles.receiptLine}>
                <Text style={styles.receiptLabel}>Kupon & Pos ({pricing.num_waypoints} Pos)</Text>
                <Text style={styles.receiptVal}>{formatPrice(pricing.waypoint_subtotal_idr)}</Text>
              </View>
              {pricing.is_off_peak && (
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptDiscountLabel}>Diskon Off-Peak Pagi (20%)</Text>
                  <Text style={styles.receiptDiscountVal}>-{formatPrice(pricing.discount_amount_idr)}</Text>
                </View>
              )}
              <View style={styles.receiptDivider} />
              <View style={styles.receiptTotalLine}>
                <Text style={styles.receiptTotalLabel}>Total Harga Pas</Text>
                <Text style={styles.receiptTotalVal}>{formatPrice(pricing.final_price_idr)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Waypoints Interactive List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Titik Pos Wisata & Narasi ({trail.waypoints?.length || 0} Titik)
          </Text>
          <Text style={styles.pricingSub}>
            Datangi pos dan lakukan check-in GPS (radius 50m) untuk membuka narasi sejarah & voucher promo UMKM!
          </Text>

          <View style={styles.waypointsList}>
            {trail.waypoints?.map((wp, idx) => (
              <View key={wp.id} style={styles.waypointItem}>
                <View style={styles.waypointSequenceCol}>
                  <View style={styles.sequenceCircle}>
                    <Text style={styles.sequenceNumber}>{wp.sequence}</Text>
                  </View>
                  {idx < (trail.waypoints?.length || 0) - 1 && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.waypointContent}>
                  <View style={styles.waypointTitleRow}>
                    <Text style={styles.waypointName}>{wp.name}</Text>
                    <View style={styles.radiusPill}>
                      <Text style={styles.radiusPillText}>Radius {wp.radius_m}m</Text>
                    </View>
                  </View>
                  <Text style={styles.waypointDesc}>{wp.description}</Text>

                  {/* UMKM Partner Box */}
                  <View style={styles.umkmBox}>
                    <View style={styles.umkmHeader}>
                      <Ionicons name="storefront" size={14} color={Colors.primary} />
                      <Text style={styles.umkmNameText}>{wp.umkm_name}</Text>
                    </View>
                    <Text style={styles.umkmPromoTeaser}>{wp.promo_teaser}</Text>
                    <View style={styles.lockedVoucherRow}>
                      <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
                      <Text style={styles.lockedVoucherText}>
                        Kode voucher terbuka otomatis saat GPS Check-in
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Total Pembayaran</Text>
          <Text style={styles.bottomPriceVal}>
            {pricing ? formatPrice(pricing.final_price_idr) : formatPrice(trail.price_idr)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => setShowCheckoutModal(true)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[Colors.primaryLight, Colors.primary]}
            style={styles.buyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buyButtonText}>Beli Digital Pass 🎟️</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Checkout Transparent Split Modal */}
      <Modal visible={showCheckoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Beli Digital Trail Pass</Text>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTrailName}>{trail.title}</Text>
            <Text style={styles.modalSub}>
              Rencana Kunjungan: Jam {visitTime} WIB ({pricing?.is_off_peak ? 'Diskon Pagi 20%' : 'Normal'})
            </Text>

            <View style={styles.splitBox}>
              <Text style={styles.splitBoxTitle}>Transparansi Pembagian Alokasi Tiket:</Text>

              <View style={styles.splitRow}>
                <View style={styles.splitDotGreen} />
                <Text style={styles.splitLabel}>70% Dana Voucher UMKM Lokal</Text>
                <Text style={styles.splitVal}>
                  {pricing ? formatPrice(Math.round(pricing.final_price_idr * 0.7)) : '-'}
                </Text>
              </View>

              <View style={styles.splitRow}>
                <View style={styles.splitDotSky} />
                <Text style={styles.splitLabel}>15% Komisi Kurator Lokal</Text>
                <Text style={styles.splitVal}>
                  {pricing ? formatPrice(Math.round(pricing.final_price_idr * 0.15)) : '-'}
                </Text>
              </View>

              <View style={styles.splitRow}>
                <View style={styles.splitDotAmber} />
                <Text style={styles.splitLabel}>15% Pemeliharaan Platform NusaJalur</Text>
                <Text style={styles.splitVal}>
                  {pricing ? formatPrice(Math.round(pricing.final_price_idr * 0.15)) : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>Total Tagihan:</Text>
              <Text style={styles.modalTotalVal}>
                {pricing ? formatPrice(pricing.final_price_idr) : '-'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBuyBtn}
              onPress={handlePurchasePass}
              disabled={buying}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.confirmBuyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {buying ? (
                  <ActivityIndicator color="#090D16" />
                ) : (
                  <Text style={styles.confirmBuyText}>Konfirmasi & Terbitkan Pass ✨</Text>
                )}
              </LinearGradient>
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
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  themePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  themePillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  cityPillText: {
    color: Colors.sky,
    fontSize: 11,
    fontWeight: '700',
  },
  trailTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginBottom: 8,
  },
  trailDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: Colors.cardElevated,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  metricBig: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  curatorCard: {
    flexDirection: 'row',
    marginTop: 10,
  },
  curatorBigAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  curatorDetails: {
    flex: 1,
  },
  curatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  curatorBigName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  curatorBadgeTag: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  curatorBioText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  pricingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offPeakDiscountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  offPeakDiscountText: {
    color: Colors.amber,
    fontSize: 11,
    fontWeight: '700',
  },
  pricingSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
    marginTop: 2,
  },
  timeOptionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  timeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  timeOptionBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
  },
  timeOptionText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timeOptionTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  pricingReceipt: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 14,
    padding: 12,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  receiptVal: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  receiptDiscountLabel: {
    color: Colors.amber,
    fontSize: 12,
    fontWeight: '600',
  },
  receiptDiscountVal: {
    color: Colors.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  receiptTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTotalLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  receiptTotalVal: {
    color: Colors.primaryLight,
    fontSize: 16,
    fontWeight: '800',
  },
  waypointsList: {
    marginTop: 10,
  },
  waypointItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  waypointSequenceCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
  },
  sequenceCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceNumber: {
    color: '#090D16',
    fontWeight: '800',
    fontSize: 13,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  waypointContent: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    borderRadius: 14,
    padding: 12,
  },
  waypointTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  waypointName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  radiusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  radiusPillText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  waypointDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  umkmBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  umkmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  umkmNameText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  umkmPromoTeaser: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  lockedVoucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedVoucherText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomPriceLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  bottomPriceVal: {
    color: Colors.primaryLight,
    fontSize: 18,
    fontWeight: '800',
  },
  buyButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalTrailName: {
    color: Colors.primaryLight,
    fontSize: 15,
    fontWeight: '700',
  },
  modalSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  splitBox: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  splitBoxTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  splitDotSky: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sky,
    marginRight: 8,
  },
  splitDotAmber: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.amber,
    marginRight: 8,
  },
  splitLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  splitVal: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalTotalLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  modalTotalVal: {
    color: Colors.primaryLight,
    fontSize: 22,
    fontWeight: '900',
  },
  confirmBuyBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmBuyGradient: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBuyText: {
    color: '#090D16',
    fontSize: 15,
    fontWeight: '800',
  },
});
