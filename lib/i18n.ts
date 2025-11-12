type TranslationDictionary = {
  brand: {
    title: string;
  };
  nav: {
    home: string;
    skills: string;
    projects: string;
    services: string;
    contact: string;
    admin: string;
    toggleMenu: string;
  };
  auth: {
    login: string;
    logout: string;
    loading: string;
  };
  user: {
    default: string;
  };
  menu: {
    wallet: string;
    bankAccounts: string;
    orders: string;
    bookmarks: string;
    walletAddress: string;
  };
  theme: {
    label: string;
    lightMode: string;
    darkMode: string;
    switchToLight: string;
    switchToDark: string;
  };
  language: {
    selectorLabel: string;
  };
};

export const translations = {
  en: {
    brand: {
      title: "Blog Website",
    },
    nav: {
      home: "Home",
      skills: "My Skills",
      projects: "Projects",
      services: "Services",
      contact: "Contact",
      admin: "Admin",
      toggleMenu: "Toggle menu",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      loading: "Loading...",
    },
    user: {
      default: "User",
    },
    menu: {
      wallet: "Wallet",
      bankAccounts: "Bank Accounts",
      orders: "My Orders",
      bookmarks: "Bookmarks",
      walletAddress: "Wallet Address",
    },
    theme: {
      label: "Theme",
      lightMode: "Light mode",
      darkMode: "Dark mode",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
    },
    language: {
      selectorLabel: "Language",
    },
  },
  hi: {
    brand: {
      title: "\u092C\u094D\u0932\u0949\u0917\u0020\u0935\u0947\u092C\u0938\u093E\u0907\u091F",
    },
    nav: {
      home: "\u092E\u0941\u0916\u094D\u092F\u0020\u092A\u0943\u0937\u094D\u0920",
      skills: "\u092E\u0947\u0930\u0940\u0020\u0915\u094D\u0937\u092E\u0924\u093E\u090F\u0901",
      projects: "\u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F\u094D\u0938",
      services: "\u0938\u0947\u0935\u093E\u090F\u0901",
      contact: "\u0938\u0902\u092A\u0930\u094D\u0915",
      admin: "\u092A\u094D\u0930\u0936\u093E\u0938\u0928",
      toggleMenu: "\u092E\u0947\u0928\u0942\u0020\u092C\u0926\u0932\u0947\u0902",
    },
    auth: {
      login: "\u0932\u0949\u0917\u093F\u0928",
      logout: "\u0932\u0949\u0917\u0906\u0909\u091F",
      loading: "\u0932\u094B\u0921\u0020\u0939\u094B\u0020\u0930\u0939\u093E\u0020\u0939\u0948\u002E\u002E\u002E",
    },
    user: {
      default: "\u0909\u092A\u092F\u094B\u0917\u0915\u0930\u094D\u0924\u093E",
    },
    menu: {
      wallet: "\u0935\u0949\u0932\u0947\u091F",
      bankAccounts: "\u092C\u0948\u0902\u0915\u0020\u0916\u093E\u0924\u0947",
      orders: "\u092E\u0947\u0930\u0947\u0020\u0906\u0926\u0947\u0936",
      bookmarks: "\u092C\u0941\u0915\u092E\u093E\u0930\u094D\u0915",
      walletAddress: "\u0935\u0949\u0932\u0947\u091F\u0020\u092A\u0924\u093E",
    },
    theme: {
      label: "\u0925\u0940\u092E",
      lightMode: "\u0932\u093E\u0907\u091F\u0020\u092E\u094B\u0921",
      darkMode: "\u0921\u093E\u0930\u094D\u0915\u0020\u092E\u094B\u0921",
      switchToLight: "\u0932\u093E\u0907\u091F\u0020\u092E\u094B\u0921\u0020\u092A\u0930\u0020\u092C\u0926\u0932\u0947\u0902",
      switchToDark: "\u0921\u093E\u0930\u094D\u0915\u0020\u092E\u094B\u0921\u0020\u092A\u0930\u0020\u092C\u0926\u0932\u0947\u0902",
    },
    language: {
      selectorLabel: "\u092D\u093E\u0937\u093E",
    },
  },
} as const satisfies Record<string, TranslationDictionary>;

export type SupportedLanguage = keyof typeof translations;

const languageOptions = [
  { code: "en" as SupportedLanguage, label: "English" },
  { code: "hi" as SupportedLanguage, label: "\u0939\u093F\u0928\u094D\u0926\u0940" },
] as const;

const getNestedValue = (dictionary: unknown, key: string): string | undefined => {
  const value = key.split(".").reduce<any>((acc, current) => {
    if (acc && typeof acc === "object" && current in acc) {
      return acc[current];
    }
    return undefined;
  }, dictionary);
  return typeof value === "string" ? value : undefined;
};

export const isSupportedLanguage = (value: unknown): value is SupportedLanguage =>
  typeof value === "string" &&
  Object.prototype.hasOwnProperty.call(translations, value);

export const translate = (language: SupportedLanguage, key: string): string =>
  getNestedValue(translations[language], key) ??
  getNestedValue(translations.en, key) ??
  key;

export const getLanguageOptions = () => languageOptions;
