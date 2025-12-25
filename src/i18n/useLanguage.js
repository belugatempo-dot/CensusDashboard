import { useState, useEffect } from 'react';
import { translations } from './translations';

export const useLanguage = () => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first, default to 'en'
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const t = translations[language];

  return {
    language,
    setLanguage,
    toggleLanguage,
    t
  };
};
