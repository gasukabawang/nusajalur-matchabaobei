import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Colors } from '../theme/colors';
import { getActiveApiUrl, setActiveApiUrl, DEFAULT_API_URL, LOCAL_API_URL, OFFICIAL_PROD_URL } from '../api/client';

const { width, height } = Dimensions.get('window');

export const AuthScreen: React.FC = () => {
  const { login, loginDemo, register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showPass, setShowPass] = useState(false);

  React.useEffect(() => {
    getActiveApiUrl().then(setServerUrl);
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t.auth.attention, t.auth.fillEmail);
      return;
    }
    if (!isLoginMode && !fullName.trim()) {
      Alert.alert(t.auth.attention, t.auth.fillName);
      return;
    }
    setLoading(true);
    try {
      if (isLoginMode) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, fullName.trim());
      }
    } catch (err: any) {
      Alert.alert(isLoginMode ? t.auth.loginFailed : t.auth.attention, err?.message || t.auth.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginDemo();
    } catch (err: any) {
      Alert.alert(t.auth.demoFailed, err?.message || t.auth.error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyServer = async (url: string) => {
    await setActiveApiUrl(url);
    setServerUrl(url);
    setShowServerModal(false);
    Alert.alert('✅', `Server: ${url}`);
  };

  const servers = [
    { label: '🌐 Cloudflare Tunnel (Dev)', url: DEFAULT_API_URL },
    { label: '🏠 Lokal LAN', url: LOCAL_API_URL },
    { label: '🚀 Produksi (STB)', url: OFFICIAL_PROD_URL },
  ];

  return (
    <View style={styles.root}>
      {/* === HEADER ILLUSTRATION AREA === */}
      <LinearGradient colors={Colors.gradientHero} style={styles.heroArea}>
        {/* Decorative circles */}
        <View style={styles.decoCircle1} />
        <View style={styles.decoCircle2} />
        <View style={styles.decoCircle3} />

        {/* Top bar: lang + server */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBtn} onPress={() => setShowLangPicker(true)}>
            <Ionicons name="language" size={16} color={Colors.textOnDark} />
            <Text style={styles.topBtnText}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBtn} onPress={() => setShowServerModal(true)}>
            <Ionicons name="server-outline" size={14} color={Colors.textOnDark} />
            <Text style={styles.topBtnText} numberOfLines={1}>
              {serverUrl.includes('trycloudflare') ? '☁️ Dev' : serverUrl.includes('stei.fun') ? '🚀 Prod' : '🏠 LAN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logo + brand */}
        <View style={styles.heroContent}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>👟</Text>
          </View>
          <Text style={styles.brandName}>NusaJalur</Text>
          <Text style={styles.brandTagline}>{t.auth.tagline}</Text>

          {/* Decorative trail icons */}
          <View style={styles.trailIcons}>
            {['🏛️', '🌲', '🍜', '📐', '⚔️', '🗺️'].map((icon, i) => (
              <View key={i} style={[styles.iconBubble, { opacity: 0.7 + i * 0.05 }]}>
                <Text style={styles.iconBubbleText}>{icon}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* === FORM CARD === */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card header */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isLoginMode ? t.auth.loginTitle : t.auth.registerTitle}
            </Text>

            {/* Register: full name */}
            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.auth.fullName}</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={Colors.primaryMid} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t.auth.fullNamePlaceholder}
                    placeholderTextColor={Colors.textLight}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.auth.email}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.primaryMid} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t.auth.emailPlaceholder}
                  placeholderTextColor={Colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.auth.password}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.primaryMid} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder={t.auth.passwordPlaceholder}
                  placeholderTextColor={Colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Main CTA */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryMid]}
                style={styles.primaryBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isLoginMode ? t.auth.loginBtn : t.auth.registerBtn}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Switch mode */}
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => { setIsLoginMode(!isLoginMode); setEmail(''); setPassword(''); setFullName(''); }}
            >
              <Text style={styles.switchText}>
                {isLoginMode ? t.auth.switchToRegister : t.auth.switchToLogin}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo login */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={handleDemoLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.demoBtnText}>{t.auth.demoBtn}</Text>
              <Text style={styles.demoSubText}>{t.auth.demoInfo}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* === LANGUAGE PICKER MODAL === */}
      {showLangPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🌐 {t.profile.chooseLanguage}</Text>
            <Text style={styles.modalSub}>{t.profile.selectLang}</Text>

            {[
              { code: 'id' as const, label: 'Bahasa Indonesia', flag: '🇮🇩', sub: 'Pilihan default' },
              { code: 'en' as const, label: 'English', flag: '🇬🇧', sub: 'Default choice' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, language === lang.code && styles.langOptionActive]}
                onPress={async () => { await setLanguage(lang.code); setShowLangPicker(false); }}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>
                    {lang.label}
                  </Text>
                  <Text style={styles.langSub}>{lang.sub}</Text>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowLangPicker(false)}>
              <Text style={styles.modalCloseTxt}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* === SERVER MODAL === */}
      {showServerModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🖥️ {t.auth.serverLabel}</Text>
            <Text style={styles.modalSub}>URL aktif: {serverUrl}</Text>

            {servers.map((s) => (
              <TouchableOpacity
                key={s.url}
                style={[styles.langOption, serverUrl === s.url && styles.langOptionActive]}
                onPress={() => handleApplyServer(s.url)}
              >
                <View style={styles.langInfo}>
                  <Text style={[styles.langLabel, serverUrl === s.url && styles.langLabelActive]}>
                    {s.label}
                  </Text>
                  <Text style={styles.langSub} numberOfLines={1}>{s.url}</Text>
                </View>
                {serverUrl === s.url && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowServerModal(false)}>
              <Text style={styles.modalCloseTxt}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  // Hero
  heroArea: {
    height: height * 0.40,
    paddingTop: 44,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  decoCircle1: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)',
    top: -60, right: -50,
  },
  decoCircle2: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30, left: -40,
  },
  decoCircle3: {
    position: 'absolute', width: 80, height: 80,
    borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)',
    top: 60, right: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    maxWidth: 160,
  },
  topBtnText: { color: Colors.textOnDark, fontSize: 12, fontWeight: '600' },

  heroContent: { alignItems: 'center', paddingTop: 4 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  logoEmoji: { fontSize: 32 },
  brandName: {
    fontSize: 28, fontWeight: '800', color: Colors.textOnDark,
    letterSpacing: 0.5, marginBottom: 4,
  },
  brandTagline: {
    fontSize: 12, color: 'rgba(255,255,255,0.80)',
    textAlign: 'center', paddingHorizontal: 24, lineHeight: 18,
    marginBottom: 14,
  },
  trailIcons: { flexDirection: 'row', gap: 8 },
  iconBubble: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBubbleText: { fontSize: 16 },

  // Form
  formScroll: { flex: 1 },
  formContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 24,
    marginTop: -20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: 20, textAlign: 'center',
  },

  // Input
  inputGroup: { marginBottom: 14 },
  inputLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    marginBottom: 6, marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSage,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    height: '100%',
  },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 4 },

  // Primary button
  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 6, marginBottom: 10 },
  primaryBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Switch
  switchBtn: { alignItems: 'center', paddingVertical: 8 },
  switchText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: Colors.textMuted },

  // Demo button
  demoBtn: {
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.amber + '44',
  },
  demoBtnText: { color: Colors.amber, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  demoSubText: { color: Colors.amber + 'AA', fontSize: 11 },

  // Modal
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  langOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    marginBottom: 10, gap: 12,
  },
  langOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryXPale,
  },
  langFlag: { fontSize: 24 },
  langInfo: { flex: 1 },
  langLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  langLabelActive: { color: Colors.primary },
  langSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  modalCloseBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceSage,
    borderRadius: 14,
  },
  modalCloseTxt: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
});
