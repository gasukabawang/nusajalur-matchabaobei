import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations, TranslationKeys } from '../i18n/translations';

const LANG_KEY = '@nusajalur_language';

interface LanguageContextType {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'id',
  t: translations.id,
  setLanguage: async () => {},
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLang] = useState<Language>('id');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved === 'id' || saved === 'en') setLang(saved);
    });
  }, []);

  const setLanguage = async (lang: Language) => {
    setLang(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t: translations[language], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
