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
import { useLanguage } from '../context/LanguageContext';
import { TRAIL_TRANSLATIONS_EN } from '../theme/trailAssets';

interface TrailDetailScreenProps {
  route: any;
  navigation: any;
}

export const TrailDetailScreen: React.FC<TrailDetailScreenProps> = ({ route, navigation }) => {
  const { trailId } = route.params;
  const { t, language } = useLanguage();
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
      Alert.alert(t.detail.loadError, err?.message || t.detail.loadErrorDesc);
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
        t.detail.purchaseSuccess,
        t.detail.purchaseSuccessMsg.replace('{title}', trail?.title || ''),
        [
          {
            text: t.detail.startWalking,
            onPress: () => navigation.navigate('Checkin', { passId: newPass.id, trailTitle: trail?.title }),
          },
          {
            text: t.detail.viewMyPasses,
            onPress: () => navigation.navigate('PassesTab'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Transaction error');
    } finally {
      setBuying(false);
    }
  };

  if (loading || !trail) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  const formatPrice = (price: number) => t.common.idr + ' ' + price.toLocaleString('id-ID');

  const isEn = language === 'en';
  const localized = isEn && trail && TRAIL_TRANSLATIONS_EN[trail.id] ? TRAIL_TRANSLATIONS_EN[trail.id] : null;
  const displayTitle = localized ? localized.title : trail.title;
  const displayDesc = localized ? localized.description : trail.description;

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {t.detail.navTitle}
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

          <Text style={styles.trailTitle}>{displayTitle}</Text>
          <Text style={styles.trailDesc}>{displayDesc}</Text>

          {/* Metric Badges */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Ionicons name="walk" size={18} color={Colors.primary} />
              <Text style={styles.metricBig}>{trail.distance_km} km</Text>
              <Text style={styles.metricLabel}>{t.detail.distanceMetric}</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="time" size={18} color={Colors.sky} />
              <Text style={styles.metricBig}>{trail.est_duration_min} {t.home.duration}</Text>
              <Text style={styles.metricLabel}>{t.detail.durationMetric}</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="flame" size={18} color={Colors.amber} />
              <Text style={styles.metricBig}>{trail.est_kcal}</Text>
              <Text style={styles.metricLabel}>{t.detail.kcalMetric}</Text>
            </View>
            <View style={styles.metricBox}>
              <Ionicons name="footsteps" size={18} color={Colors.primaryLight} />
              <Text style={styles.metricBig}>{trail.est_steps.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>{t.detail.stepsMetric}</Text>
            </View>
          </View>
        </View>

        {/* Curator Profile */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t.detail.curator}</Text>
          <View style={styles.curatorCard}>
            <Image source={{ uri: trail.curator.avatar_url }} style={styles.curatorBigAvatar} />
            <View style={styles.curatorDetails}>
              <View style={styles.curatorNameRow}>
                <Text style={styles.curatorBigName}>{trail.curator.name}</Text>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.curatorBadgeTag}>{trail.curator.badge || t.detail.curatorCertified}</Text>
              <Text style={styles.curatorBioText}>{trail.curator.bio}</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Pricing Selector */}
        <View style={styles.sectionCard}>
          <View style={styles.pricingHeaderRow}>
            <Text style={styles.sectionTitle}>{t.detail.pricing}</Text>
            <View style={styles.offPeakDiscountTag}>
              <Ionicons name="sparkles" size={11} color={Colors.amber} />
              <Text style={styles.offPeakDiscountText} numberOfLines={1}>{t.detail.offPeakDesc}</Text>
            </View>
          </View>
          <Text style={styles.pricingSub}>
            {t.detail.pricingSub}
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
                07:00 WIB ({t.home.alam === 'Nature' ? 'Morning' : 'Pagi'})
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
                11:00 WIB ({t.home.alam === 'Nature' ? 'Normal' : 'Normal'})
              </Text>
            </TouchableOpacity>
          </View>

          {pricing && (
            <View style={styles.pricingReceipt}>
              <View style={styles.receiptLine}>
                <Text style={styles.receiptLabel}>{t.detail.priceLabel}</Text>
                <Text style={styles.receiptVal}>{formatPrice(pricing.base_trail_price_idr)}</Text>
              </View>
              <View style={styles.receiptLine}>
                <Text style={styles.receiptLabel}>{t.detail.waypointsSubtotal} ({pricing.num_waypoints} {t.detail.waypointCount})</Text>
                <Text style={styles.receiptVal}>{formatPrice(pricing.waypoint_subtotal_idr)}</Text>
              </View>
              {pricing.is_off_peak && (
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptDiscountLabel}>{t.detail.offPeakLabel}</Text>
                  <Text style={styles.receiptDiscountVal}>-{formatPrice(pricing.discount_amount_idr)}</Text>
                </View>
              )}
              <View style={styles.receiptDivider} />
              <View style={styles.receiptTotalLine}>
                <Text style={styles.receiptTotalLabel}>{t.detail.totalPrice}</Text>
                <Text style={styles.receiptTotalVal}>{formatPrice(pricing.final_price_idr)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Waypoints Interactive List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {t.detail.waypoints} ({trail.waypoints?.length || 0})
          </Text>
          <Text style={styles.pricingSub}>
            {t.detail.geofenceHint}
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
                      <Text style={styles.radiusPillText}>{t.detail.radius} {wp.radius_m}m</Text>
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
                        {t.detail.voucherHint}
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
          <Text style={styles.bottomPriceLabel}>{t.detail.totalPayment}</Text>
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
            colors={[Colors.primary, Colors.primaryMid]}
            style={styles.buyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buyButtonText}>{t.detail.buyPass}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Checkout Transparent Split Modal */}
      <Modal visible={showCheckoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.detail.confirmPurchase}</Text>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <Ionicons name="close-circle" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTrailName}>{trail.title}</Text>
            <Text style={styles.modalSub}>
              {t.detail.purchaseDesc} {visitTime} WIB ({pricing?.is_off_peak ? t.detail.offPeakDesc : 'Normal'})
            </Text>

            <View style={styles.splitBox}>
              <Text style={styles.splitBoxTitle}>{t.detail.splitTitle}</Text>

              <View style={styles.splitRow}>
                <View style={styles.splitDotGreen} />
                <Text style={styles.splitLabel}>{t.detail.splitUmkm}</Text>
                <Text style={styles.splitVal}>
                  {pricing ? formatPrice(Math.round(pricing.final_price_idr * 0.7)) : '-'}
                </Text>
              </View>

              <View style={styles.splitRow}>
                <View style={styles.splitDotSky} />
                <Text style={styles.splitLabel}>{t.detail.splitCurator}</Text>
                <Text style={styles.splitVal}>
                  {pricing ? formatPrice(Math.round(pricing.final_price_idr * 0.15)) : '-'}
                </Text>
              </View>

              <View style={styles.splitRow}>
                <View style={styles.splitDotAmber} />
                <Text style={styles.splitLabel}>{t.detail.splitPlatform}</Text>
                <Text style={styles.splitVal}>
                  {pricing ? formatPrice(Math.round(pricing.final_price_idr * 0.15)) : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>{t.detail.totalBill}</Text>
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
                colors={[Colors.primary, Colors.primaryMid]}
                style={styles.confirmBuyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {buying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBuyText}>{t.detail.confirmBtn}</Text>
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
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  themePill: {
    backgroundColor: Colors.primaryXPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themePillText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.skyLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cityPillText: {
    color: Colors.sky,
    fontSize: 11,
    fontWeight: '600',
  },
  trailTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  trailDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSage,
    borderRadius: 16,
    padding: 12,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricBig: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
    flex: 1,
    flexShrink: 1,
  },
  curatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surfaceSage,
    borderRadius: 16,
    padding: 14,
  },
  curatorBigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
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
    fontWeight: '800',
  },
  curatorBadgeTag: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
    marginVertical: 2,
  },
  curatorBioText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  pricingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  offPeakDiscountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 1,
  },
  offPeakDiscountText: {
    color: Colors.amber,
    fontSize: 10,
    fontWeight: '800',
    flexShrink: 1,
  },
  pricingSub: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
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
    gap: 6,
    backgroundColor: Colors.surfaceSage,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timeOptionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryXPale,
  },
  timeOptionText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  timeOptionTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  pricingReceipt: {
    backgroundColor: Colors.surfaceSage,
    borderRadius: 14,
    padding: 14,
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
    fontWeight: '800',
  },
  receiptTotalVal: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  waypointsList: {
    marginTop: 6,
  },
  waypointItem: {
    flexDirection: 'row',
    gap: 12,
  },
  waypointSequenceCol: {
    alignItems: 'center',
    width: 28,
  },
  sequenceCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sequenceNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  waypointContent: {
    flex: 1,
    marginBottom: 20,
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
    fontWeight: '800',
    flex: 1,
  },
  radiusPill: {
    backgroundColor: Colors.surfaceSage,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusPillText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  waypointDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  umkmBox: {
    backgroundColor: Colors.surfaceSage,
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  umkmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  umkmNameText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  umkmPromoTeaser: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
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
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceCol: {},
  bottomPriceLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  bottomPriceVal: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  buyButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyButtonGradient: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalTrailName: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  splitBox: {
    backgroundColor: Colors.surfaceSage,
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
    fontSize: 12,
    flex: 1,
  },
  splitVal: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalTotalLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  modalTotalVal: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  confirmBuyBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmBuyGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBuyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
