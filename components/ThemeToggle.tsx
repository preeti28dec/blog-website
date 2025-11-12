"use client";

import { FaMoon, FaSun } from "react-icons/fa";
import { useTheme, useTranslation } from "./Providers";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme, isReady } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === "dark";
  const Icon = isDark ? FaSun : FaMoon;
  const buttonLabel = t(isDark ? "theme.switchToLight" : "theme.switchToDark");
  const label = isReady
    ? t(isDark ? "theme.lightMode" : "theme.darkMode")
    : t("theme.label");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!isReady}
      aria-pressed={theme === "dark"}
      aria-label={buttonLabel}
      className={`flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
