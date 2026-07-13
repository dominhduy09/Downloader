import React, { createContext, useState, useContext, useEffect } from "react";
import { translations } from "../translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Read local storage to see if user has already set a language, default to 'en'
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem("downloader_lang");
    if (savedLang && translations[savedLang]) {
      return savedLang;
    }
    return "en";
  });

  // Action: Switch language and store selection in localStorage
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem("downloader_lang", lang);
    }
  };

  // Translation lookup helper (failsafe fallback to English)
  const t = (key) => {
    const langDict = translations[language] || translations["en"];
    const fallbackDict = translations["en"];
    
    if (langDict[key] !== undefined) {
      return langDict[key];
    }
    if (fallbackDict[key] !== undefined) {
      return fallbackDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to consume language states
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
