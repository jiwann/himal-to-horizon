import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { translations, RTL_LANGUAGES } from "@/lib/i18n";
import type { Language, TranslationKey } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "h2h_language";

const BROWSER_LANG_MAP: Record<string, Language> = {
  es: "es", pt: "pt", fr: "fr", ar: "ar", hi: "hi", bn: "bn", ne: "ne",
  ko: "ko", ja: "ja", zh: "zh", de: "de", ru: "ru", pl: "pl",
  fi: "fi", sv: "sv", no: "no", vi: "vi", th: "th",
};

function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && stored in translations) return stored;
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const lang of langs) {
      const code = lang?.slice(0, 2).toLowerCase();
      if (code === "en") return "en";
      const mapped = BROWSER_LANG_MAP[code];
      if (mapped) return mapped;
    }
  } catch {}
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);
  const isRtl = RTL_LANGUAGES.includes(language);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [language, isRtl]);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
  }

  function t(key: TranslationKey): string {
    return translations[language][key] ?? translations["en"][key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
