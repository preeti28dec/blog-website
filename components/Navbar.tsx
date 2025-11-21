"use client";

import React, { useState, useEffect, memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUser,
  FaAddressBook,
  FaMoon,
  FaSun,
  FaPen,
  FaUserShield,
  FaSignInAlt,
} from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "./Providers";

const Navbar = memo(function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const { theme, toggleTheme, isReady } = useTheme();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const navLinks = useMemo(() => {
    const links = [
      { href: "/", label: "Home", icon: FaHome },
      { href: "/about", label: "About", icon: FaUser },
      { href: "/contact", label: "Contact", icon: FaAddressBook },
    ];

    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      links.push({ href: "/admin", label: "Create Article", icon: FaPen });
    }

    if (userRole === "SUPER_ADMIN") {
      links.push({ href: "/admin/users", label: "Manage Users", icon: FaUserShield });
    }

    return links;
  }, [userRole]);

  const isDark = theme === "dark";
  const ThemeIcon = isDark ? FaSun : FaMoon;

  return (
    <nav className="sticky top-0 z-50 bg-gray-100 dark:bg-gray-900 shadow-sm">
      <div className="relative">
        <div className="relative container mx-auto px-4">
        <div className="flex justify-between items-center h-20 gap-3">
          {/* Brand Logo */}
          <Link 
            href="/" 
            className="flex items-center text-2xl gap-1 px-4 transition-colors font-semibold z-10"
          >
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
              T
            </span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              optiersportsledger
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href === "/" && pathname === "/");
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-500 dark:to-purple-700 text-white shadow-lg"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-md hover:shadow-lg"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={toggleTheme}
                disabled={!isReady}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200"
              >
                <ThemeIcon className="h-5 w-5" />
              </button>
              {session ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm"
                >
                  <FaSignInAlt className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="lg:hidden flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={toggleTheme}
                disabled={!isReady}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200"
              >
                <ThemeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-900 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <FaTimes className="w-6 h-6" />
                ) : (
                  <FaBars className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-200 dark:border-purple-800 py-4 relative z-10">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-3 px-4 pb-3 border-b border-purple-100 dark:border-purple-800">
                <button
                  type="button"
                  onClick={toggleTheme}
                  disabled={!isReady}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200"
                >
                  <ThemeIcon className="h-5 w-5" />
                </button>
              </div>
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href === "/" && pathname === "/");
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-500 dark:to-purple-700 text-white shadow-lg"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 shadow-md"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              {session ? (
                <div className="px-4 py-3 border-t border-purple-200 dark:border-purple-800 mt-3 pt-3 space-y-3">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <FaSignInAlt className="w-5 h-5" />
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </nav>
  );
});

export default Navbar;
