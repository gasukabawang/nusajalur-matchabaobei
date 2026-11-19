// NusaJalur Color System — Nature Sage + Warm Cream (inspired by camp/travel app aesthetic)
export const Colors = {
  // === BACKGROUNDS (warm light, nature-inspired) ===
  background: '#F5F0E8',       // Warm cream / rice paper
  backgroundAlt: '#EEE8D8',   // Slightly deeper cream
  surface: '#FFFFFF',          // Pure white card
  surfaceWarm: '#FBF7F0',     // Off-white warm card
  surfaceSage: '#EDF5EE',     // Very light sage card

  // === BRAND GREENS (sage forest palette) ===
  primary: '#3D7A5F',          // Deep forest sage
  primaryMid: '#5B9E7B',       // Medium sage
  primaryLight: '#7EC8A0',     // Light sage / mint
  primaryPale: '#C8E6D4',     // Very pale sage (chip bg, badge)
  primaryXPale: '#EDF5EE',    // Ghost sage (card tint)

  // === ACCENT EARTH TONES ===
  amber: '#D97706',            // Warm amber / harvest
  amberLight: '#FEF3C7',      // Pale amber bg
  terracotta: '#C2673A',      // Terracotta / culture
  terracottaLight: '#FDE8DC', // Pale terracotta bg
  sky: '#2E86AB',              // Calm teal blue
  skyLight: '#DBEAFE',        // Pale blue bg

  // === TYPOGRAPHY ===
  textPrimary: '#1A2E22',     // Very dark forest green (almost black)
  textSecondary: '#4A6741',   // Medium forest green
  textMuted: '#8A9E83',       // Muted sage text
  textLight: '#B5C4AE',       // Light sage text
  textOnDark: '#F5F0E8',     // Cream on dark backgrounds

  // === BORDERS & DIVIDERS ===
  border: '#D8E8D2',           // Soft sage border
  borderLight: '#EBF2E8',     // Very light sage border
  borderWarm: '#E8DFD0',      // Warm cream border
  divider: '#EBF2E8',         // Divider line

  // === SPECIAL SURFACES ===
  cardShadow: 'rgba(61, 122, 95, 0.10)',   // Sage card shadow
  overlay: 'rgba(26, 46, 34, 0.75)',        // Dark overlay for modals
  overlayLight: 'rgba(26, 46, 34, 0.40)', // Light overlay
  shimmer: '#E8F0E5',                       // Skeleton shimmer

  // === STATUS COLORS ===
  success: '#3D7A5F',
  successLight: '#C8E6D4',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#C2673A',
  errorLight: '#FDE8DC',

  // === GRADIENTS (defined as tuples for LinearGradient) ===
  gradientHero: ['#3D7A5F', '#5B9E7B', '#7EC8A0'] as string[],
  gradientCard: ['#FFFFFF', '#F5F0E8'] as string[],
  gradientWarm: ['#FBF7F0', '#EEE8D8'] as string[],
  gradientOverlay: ['rgba(26,46,34,0)', 'rgba(26,46,34,0.85)'] as string[],
  gradientSage: ['#EDF5EE', '#C8E6D4'] as string[],
};
