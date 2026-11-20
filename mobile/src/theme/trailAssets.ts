// Mapping curated high-resolution photography for each trail in Bandung & Jakarta
export const TRAIL_IMAGES: Record<string, string> = {
  // Bandung Trails
  'trail-braga-heritage':
    'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80', // Colonial architecture / Braga
  'trail-cihapit-culinary':
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', // Culinary market / traditional food
  'trail-arsitektur-balaikota-gedungsate':
    'https://images.unsplash.com/photo-1590059390046-52c67b2d56a0?auto=format&fit=crop&w=800&q=80', // Gedung Sate / City park
  'trail-ganesha-sabuga-itb':
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80', // ITB / Ganesha / Campus woods
  'trail-alam-dago-pakar':
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80', // Forest / Pine trees / Tahura
  'trail-pecinan-cibadak':
    'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?auto=format&fit=crop&w=800&q=80', // Chinatown lanterns / night market

  // Jakarta Trails
  'trail-jkt-kotatua-sundakelapa':
    'https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=800&q=80', // Batavia Old Town / Fatahillah
  'trail-jkt-glodok-pecinan':
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', // Tea house / Chinatown market
  'trail-jkt-lapangan-banteng':
    'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80', // Cathedral / Istiqlal / Monument
  'trail-jkt-menteng-cikini':
    'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80', // Park / Heritage city street
  'trail-jkt-setu-babakan':
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // Lake / Betawi nature village
};

// English translations for title & descriptions of all 11 trails
export const TRAIL_TRANSLATIONS_EN: Record<string, { title: string; description: string }> = {
  'trail-braga-heritage': {
    title: 'Colonial & Art Deco Heritage Braga - Asia Afrika',
    description: 'Explore the stately Art Deco architecture of the Dutch colonial era along Jalan Braga to Bandung Kilometer Zero.',
  },
  'trail-cihapit-culinary': {
    title: 'Morning Culinary & Traditional Market of Cihapit',
    description: 'Walk through historic morning markets, vintage coffee stalls, and legendary Pasundan culinary delicacies.',
  },
  'trail-arsitektur-balaikota-gedungsate': {
    title: 'Civic Heart & City Parks: City Hall - Gedung Sate',
    description: 'A breezy walking trail crossing historic municipal parks, heritage trees, and the iconic neoclassical Gedung Sate.',
  },
  'trail-ganesha-sabuga-itb': {
    title: 'Ganesha Intellectual Green Way - Sabuga ITB',
    description: 'An educational walking trail around ITB Ganesha, Babakan Siliwangi urban forest canopy, and Sasana Budaya.',
  },
  'trail-alam-dago-pakar': {
    title: 'Wild Nature & Historical Caves of Dago Pakar',
    description: 'Breathe crisp mountain air across Tahura conservation forest, World War II Japanese bunker, and Dutch water tunnels.',
  },
  'trail-pecinan-cibadak': {
    title: 'Nostalgic Old Chinatown & Cibadak Night Walk',
    description: 'Explore Bandung’s earliest Chinese settlement, centuries-old shrines, heritage roasteries, and evening food stalls.',
  },
  'trail-jkt-kotatua-sundakelapa': {
    title: 'Old Batavia Heritage & Sunda Kelapa Port',
    description: 'Walk through Old Batavia from Fatahillah Square, the 17th-century drawbridge, to traditional Pinisi schooners.',
  },
  'trail-jkt-glodok-pecinan': {
    title: 'Cultural Gems & Legendary Eats of Glodok Chinatown',
    description: 'Stroll through Gang Gloria alleyways, Pantjoran Tea House, and Jakarta’s oldest temple Kim Tek Ie (1650).',
  },
  'trail-jkt-lapangan-banteng': {
    title: 'Classical Architecture: Lapangan Banteng - Schouwburg',
    description: 'Admire Weltevreden landmarks: West Irian Liberation Monument, Neo-Gothic Cathedral, and Istiqlal Grand Mosque.',
  },
  'trail-jkt-menteng-cikini': {
    title: 'Proclamation Trail & Heritage Charm of Menteng - Cikini',
    description: 'Trace Indonesian independence roots, garden-city streets of Menteng, and Raden Saleh arts center in Cikini.',
  },
  'trail-jkt-setu-babakan': {
    title: 'Harmony & Cultural Wisdom of Betawi Setu Babakan',
    description: 'Enjoy a tranquil freshwater lake, traditional Betawi stilt houses, Gambang Kromong melodies, and authentic Kerak Telor.',
  },
};
