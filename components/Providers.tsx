"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import {
  getLanguageOptions,
  isSupportedLanguage,
  translate,
  type SupportedLanguage,
} from "@/lib/i18n";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isReady: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

type LanguageContextValue = {
  language: SupportedLanguage;
  isLanguageReady: boolean;
  availableLanguages: readonly { code: SupportedLanguage; label: string }[];
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
};

const THEME_STORAGE_KEY = "article-theme";
const LANGUAGE_STORAGE_KEY = "article-language";
const LANGUAGE_OPTIONS = getLanguageOptions();

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      setIsReady(true);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, isReady]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isReady,
      toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
      setTheme,
    }),
    [theme, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) {
      setLanguage(stored);
    }
    setIsLanguageReady(true);
  }, []);

  useEffect(() => {
    if (!isLanguageReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.setAttribute("lang", language);
  }, [language, isLanguageReady]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isLanguageReady,
      availableLanguages: LANGUAGE_OPTIONS,
      setLanguage,
      t: (key: string) => translate(language, key),
    }),
    [language, isLanguageReady],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within the app Providers component.");
  }
  return context;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within the app Providers component.");
  }
  return context;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#363636",
              },
              success: {
                duration: 4000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
                style: {
                  background: "#d1fae5",
                  color: "#065f46",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
                style: {
                  background: "#fee2e2",
                  color: "#991b1b",
                },
              },
            }}
          />
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

