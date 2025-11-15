"use client";

import React, { useState, useEffect, memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import LanguageSelect from "./LanguageSelect";
import { useTranslation } from "./Providers";

const Navbar = memo(function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = useMemo(
    () => [
      { href: "/", label: t("nav.home") },
      { href: "/contact", label: t("nav.contact") },
      { href: "/admin", label: "Create Article" },
    ],
    [t],
  );

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Brand */}
          <Link 
            href="/" 
            className="flex items-center text-2xl gap-2 px-4 text-gray-900 dark:text-white rounded-lg transition-colors font-semibold"
          >
            {t("brand.title")}
          </Link>

          <div className="flex items-center gap-3">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-semibold transition-colors ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Preferences */}
            <div className="hidden lg:flex items-center gap-3">
              <ThemeToggle showLabel />
              <LanguageSelect />
            </div>

            {/* Mobile Preferences */}
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <LanguageSelect />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label={t("nav.toggleMenu")}
            >
              {mobileMenuOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

export default Navbar;
