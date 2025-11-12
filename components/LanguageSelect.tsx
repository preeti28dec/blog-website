"use client";

import { useTranslation } from "./Providers";

type LanguageSelectProps = {
  className?: string;
};

export default function LanguageSelect({ className = "" }: LanguageSelectProps) {
  const { language, setLanguage, availableLanguages, isLanguageReady, t } = useTranslation();

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t("language.selectorLabel")}</span>
      <select
        value={language}
        disabled={!isLanguageReady}
        onChange={(event) => {
          const selected = availableLanguages.find((option) => option.code === event.target.value);
          if (selected) {
            setLanguage(selected.code);
          }
        }}
        className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {availableLanguages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-gray-500 dark:text-gray-400 text-xs">
        v
      </span>
    </label>
  );
}
