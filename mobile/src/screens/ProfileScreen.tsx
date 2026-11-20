import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Colors } from '../theme/colors';
import { apiService } from '../api/apiService';
import { getActiveApiUrl, setActiveApiUrl, DEFAULT_API_URL, LOCAL_API_URL, OFFICIAL_PROD_URL } from '../api/client';
import { UserTripHistory } from '../types';
import { Language } from '../i18n/translations';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [stats, setStats] = useState<UserTripHistory | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [pinging, setPinging] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showServerSection, setShowServerSection] = useState(false);

  useEffect(() => {
    loadProfileStats();
    getActiveApiUrl().then((url) => {
      setCurrentApiUrl(url);
      setCustomUrl(url);
    });
  }, []);

  const loadProfileStats = async () => {
    try {
      const data = await apiService.getMyTrips();
      setStats(data);
    } catch (err: any) {
      console.log('Error loading stats:', err);
      if (err?.code === 'INVALID_TOKEN' || err?.code === 'USER_NOT_FOUND' || err?.status === 401) {
        await logout();
        return;
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const handleTestConnection = async () => {
    setPinging(true);
    const start = Date.now();
    try {
      const res = await apiService.checkHealth();
      const latency = Date.now() - start;
      Alert.alert(t.profile.connSuccess, `Status: ${res.status}\n${t.profile.latency}: ${latency} ms\nURL: ${currentApiUrl}`);
    } catch (err: any) {
      Alert.alert(t.profile.connFail, err?.message || 'Server tidak dapat dijangkau.');
    } finally {
      setPinging(false);
    }
  };

  const handleApplyUrl = async (url: string) => {
    await setActiveApiUrl(url);
    setCurrentApiUrl(url);
    setCustomUrl(url);
    Alert.alert(t.profile.serverChanged, `URL: ${url}`);
    loadProfileStats();
  };

  const handleLogout = () => {
    Alert.alert(t.profile.logoutConfirm, t.profile.logoutMsg, [
      { text: t.profile.cancel, style: 'cancel' },
      { text: t.profile.logoutOk, style: 'destructive', onPress: logout },
    ]);
  };

  const LANGUAGES: { code: Language; label: string; flag: string; native: string }[] = [
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', native: 'Indonesia' },
    { code: 'en', label: 'English', flag: '🇬🇧', native: 'United Kingdom' },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === language);

  const stats_data = [
    { icon: 'footsteps', label: t.profile.totalSteps, value: (stats?.total_steps_achieved || 0).toLocaleString(), color: Colors.primary, bg: Colors.primaryXPale },
    { icon: 'flame', label: t.profile.totalKcal, value: (stats?.total_kcal_burned || 0).toLocaleString(), color: Colors.amber, bg: Colors.amberLight },
    { icon: 'ticket', label: t.profile.totalTrips, value: String(stats?.total_passes_purchased || 0), color: Colors.sky, bg: Colors.skyLight },
    { icon: 'trophy', label: 'Rute Selesai', value: String(stats?.total_completed_trips || 0), color: Colors.terracotta, bg: Colors.terracottaLight },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <LinearGradient colors={Colors.gradientHero} style={styles.heroHeader}>
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />

        <View style={styles.avatarRing}>
          <LinearGradient colors={['#fff', Colors.primaryPale]} style={styles.avatar}>
            <Text style={styles.avatarLetter}>{user?.full_name?.charAt(0).toUpperCase() || 'P'}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.userName}>{user?.full_name || 'Penjelajah'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'demo@nusajalur.id'}</Text>
        <View style={styles.heroBadge}>
          <Ionicons name="leaf" size={12} color={Colors.textOnDark} />
          <Text style={styles.heroBadgeText}>Pejalan Budaya • Bandung</Text>
        </View>
      </LinearGradient>

      <View style={styles.bodyContent}>
        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 {t.profile.stats}</Text>
          {loadingStats ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.statsGrid}>
              {stats_data.map((s, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                  <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Language Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ {t.profile.settings}</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowLangModal(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.skyLight }]}>
                <Ionicons name="language" size={18} color={Colors.sky} />
              </View>
              <View>
                <Text style={styles.settingLabel}>{t.profile.language}</Text>
                <Text style={styles.settingValue}>{currentLang?.flag} {currentLang?.label}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Server Config (collapsible) */}
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowServerSection(!showServerSection)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: Colors.primaryXPale }]}>
                <Ionicons name="server-outline" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>{t.profile.server}</Text>
                <Text style={styles.settingValue} numberOfLines={1}>
                  {currentApiUrl.includes('trycloudflare') ? '☁️ Dev Tunnel' : currentApiUrl.includes('stei.fun') ? '🚀 Production' : '🏠 LAN'}
                </Text>
              </View>
            </View>
            <Ionicons name={showServerSection ? 'chevron-up' : 'chevron-forward'} size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {showServerSection && (
            <View style={styles.serverPanel}>
              {/* Presets */}
              <View style={styles.presetRow}>
                {[
                  { label: '☁️ Dev', url: DEFAULT_API_URL },
                  { label: '🏠 LAN', url: LOCAL_API_URL },
                  { label: '🚀 Prod', url: OFFICIAL_PROD_URL },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.url}
                    style={[styles.presetChip, currentApiUrl === s.url && styles.presetChipActive]}
                    onPress={() => handleApplyUrl(s.url)}
                  >
                    <Text style={[styles.presetChipText, currentApiUrl === s.url && styles.presetChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom URL */}
              <View style={styles.urlRow}>
                <TextInput
                  style={styles.urlInput}
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  autoCapitalize="none"
                  placeholder="http://10.x.x.x:8000/api/v1"
                  placeholderTextColor={Colors.textLight}
                />
                <TouchableOpacity style={styles.applyBtn} onPress={() => handleApplyUrl(customUrl)}>
                  <Text style={styles.applyBtnText}>{t.profile.applyUrl}</Text>
                </TouchableOpacity>
              </View>

              {/* Test connection */}
              <TouchableOpacity style={styles.testBtn} onPress={handleTestConnection} disabled={pinging}>
                {pinging ? <ActivityIndicator size="small" color={Colors.primary} /> : (
                  <>
                    <Ionicons name="pulse" size={15} color={Colors.primary} />
                    <Text style={styles.testBtnText}>{t.profile.testConnection}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* About */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutEmoji}>🗺️</Text>
          <Text style={styles.aboutTitle}>{t.profile.about}</Text>
          <Text style={styles.aboutSub}>{t.profile.version}</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>{t.profile.logout}</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </View>

      {/* Language Modal */}
      {showLangModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🌐 {t.profile.chooseLanguage}</Text>
            <Text style={styles.modalSub}>{t.profile.selectLang}</Text>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langRow, language === lang.code && styles.langRowActive]}
                onPress={async () => { await setLanguage(lang.code); setShowLangModal(false); }}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>{lang.label}</Text>
                  <Text style={styles.langSub}>{lang.native}</Text>
                </View>
                {language === lang.code && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowLangModal(false)}>
              <Text style={styles.closeBtnText}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },

  // Hero
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute', width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40, right: -50,
  },
  decoCircle2: {
    position: 'absolute', width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30, left: -30,
  },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 34, fontWeight: '900', color: Colors.primary },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.textOnDark, marginBottom: 2 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeText: { color: Colors.textOnDark, fontSize: 12, fontWeight: '700' },

  bodyContent: { padding: 20 },

  // Section
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 4,
  },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  // Settings
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  settingValue: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },

  // Server Panel
  serverPanel: { paddingTop: 10, gap: 10 },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetChip: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSage,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  presetChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryXPale },
  presetChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  presetChipTextActive: { color: Colors.primary },
  urlRow: { flexDirection: 'row', gap: 8 },
  urlInput: {
    flex: 1, height: 42, borderRadius: 12,
    backgroundColor: Colors.surfaceSage,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, fontSize: 12, color: Colors.textPrimary,
  },
  applyBtn: {
    paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: Colors.primaryXPale,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.primaryPale,
  },
  applyBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryXPale,
  },
  testBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },

  // About card
  aboutCard: {
    backgroundColor: Colors.surfaceWarm,
    borderRadius: 20, padding: 18, marginBottom: 16,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.borderWarm,
  },
  aboutEmoji: { fontSize: 32, marginBottom: 4 },
  aboutTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  aboutSub: { fontSize: 12, color: Colors.textMuted },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, borderRadius: 16,
    backgroundColor: Colors.terracottaLight,
    borderWidth: 1.5, borderColor: Colors.terracotta + '44',
  },
  logoutText: { color: Colors.error, fontSize: 15, fontWeight: '800' },

  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: 24, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 10,
  },
  langRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryXPale },
  langFlag: { fontSize: 24 },
  langInfo: { flex: 1 },
  langLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  langLabelActive: { color: Colors.primary },
  langSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  closeBtn: {
    marginTop: 8, paddingVertical: 12, alignItems: 'center',
    backgroundColor: Colors.surfaceSage, borderRadius: 14,
  },
  closeBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
});
