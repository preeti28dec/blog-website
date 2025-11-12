"use client";

import { useState, useEffect, memo, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getAuthToken, authApi } from "@/lib/api";
import { 
  FaBars, 
  FaTimes, 
  FaSignOutAlt, 
  FaWallet, 
  FaCreditCard, 
  FaBox, 
  FaBookmark,
  FaArrowRight
} from "react-icons/fa";
import ThemeToggle from "./ThemeToggle";
import LanguageSelect from "./LanguageSelect";
import { useTranslation } from "./Providers";

const Navbar = memo(function Navbar() {
  const { data: session, status } = useSession();
  const [jwtUser, setJwtUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    // Check for JWT token authentication (optimized - only check once)
    const checkAuth = async () => {
      // If NextAuth session exists, we're authenticated
      if (session) {
        setLoading(false);
        return;
      }
      
      const token = getAuthToken();
      
      // If no session but token exists, check JWT token
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.user) {
            setJwtUser(response.user);
          } else {
            // No user found, clear token
            authApi.logout();
            setJwtUser(null);
          }
        } catch (error) {
          // Token invalid, clear it
          authApi.logout();
          setJwtUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        // No token, not authenticated
        setJwtUser(null);
        setLoading(false);
      }
    };

    // Only check auth if we don't have a session and haven't checked yet
    if (status !== "loading") {
      checkAuth();
    }
  }, [session, status]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = () => {
    // Handle both NextAuth and JWT logout
    if (session) {
      signOut({ callbackUrl: "/login" });
    } else {
      authApi.logout();
      setJwtUser(null);
      router.push("/login");
      router.refresh();
    }
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  // Check if we have a token (even if user details not loaded yet)
  const hasToken = typeof window !== "undefined" ? !!getAuthToken() : false;
  const isAuthenticated = session || jwtUser || (hasToken && status !== "unauthenticated");
  const user = session?.user || jwtUser;

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = user?.name || user?.email || "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Generate wallet address (mock for now)
  const walletAddress = "0xc136...6e1a";
  // Only show loading if we don't have a token yet
  const isLoading = status === "loading" || (loading && !hasToken && !jwtUser);

  const navLinks = useMemo(
    () => [
      { href: "/", label: t("nav.home") },
      { href: "/skills", label: t("nav.skills") },
      { href: "/projects", label: t("nav.projects") },
      { href: "/services", label: t("nav.services") },
      { href: "/contact", label: t("nav.contact") },
    ],
    [t],
  );

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* Portfolio Button */}
          <Link 
            href="/" 
            className="flex items-center text-2xl gap-2 px-4 text-gray-900 dark:text-white rounded-lg  transition-colors font-semibold"
          >
            {t("brand.title")}
          </Link>

          <div className="flex items-center gap-3">
            {/* Desktop Navigation - Only show when authenticated */}
            {isAuthenticated && !isLoading && (
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
                
                <Link
                  href="/admin"
                  className={`font-semibold transition-colors ${
                    pathname === "/admin"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                {t("nav.admin")}
                </Link>

                {/* User Avatar Dropdown */}
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-purple-300 transition-all"
                  >
                    {getUserInitials()}
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {getUserInitials()}
                          </div>
                          <div>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">
                            {user?.name || t("user.default")}
                          </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href="/wallet"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaWallet className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.wallet")}</span>
                        </Link>
                        
                        <Link
                          href="/bank-accounts"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaCreditCard className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.bankAccounts")}</span>
                        </Link>
                        
                        <Link
                          href="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaBox className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.orders")}</span>
                        </Link>
                        
                        <Link
                          href="/bookmarks"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaBookmark className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.bookmarks")}</span>
                        </Link>
                        
                        <Link
                          href="/wallet"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FaWallet className="text-gray-600 dark:text-gray-400" />
                        <span
                          className="text-gray-700 dark:text-gray-300 font-mono text-sm"
                          title={t("menu.walletAddress")}
                        >
                          {walletAddress}
                        </span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                        <span className="font-semibold">{t("auth.logout")}</span>
                          <FaArrowRight className="text-sm" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show only Login button when not authenticated */}
            {!isAuthenticated && !isLoading && (
              <div className="hidden lg:block">
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  {t("auth.login")}
                </Link>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="hidden lg:block">
              <span className="text-gray-500 text-sm">{t("auth.loading")}</span>
              </div>
            )}

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

            {/* Mobile Menu Button - Only show when authenticated */}
            {isAuthenticated && !isLoading && (
              <div className="lg:hidden flex items-center gap-2">
                {/* User Avatar for Mobile */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold"
                  >
                    {getUserInitials()}
                  </button>

                  {/* Mobile Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {getUserInitials()}
                          </div>
                          <div>
                          <p className="font-semibold text-purple-600 dark:text-purple-400">
                            {user?.name || t("user.default")}
                          </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href="/wallet"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaWallet className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.wallet")}</span>
                        </Link>
                        
                        <Link
                          href="/bank-accounts"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaCreditCard className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.bankAccounts")}</span>
                        </Link>
                        
                        <Link
                          href="/orders"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaBox className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.orders")}</span>
                        </Link>
                        
                        <Link
                          href="/bookmarks"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                        <FaBookmark className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{t("menu.bookmarks")}</span>
                        </Link>
                        
                        <Link
                          href="/wallet"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FaWallet className="text-gray-600 dark:text-gray-400" />
                        <span
                          className="text-gray-700 dark:text-gray-300 font-mono text-sm"
                          title={t("menu.walletAddress")}
                        >
                          {walletAddress}
                        </span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                        <span className="font-semibold">{t("auth.logout")}</span>
                          <FaArrowRight className="text-sm" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label={t("nav.toggleMenu")}
                >
                  {mobileMenuOpen ? (
                    <FaTimes className="w-6 h-6" />
                  ) : (
                    <FaBars className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}

            {/* Show Login button on mobile when not authenticated */}
            {!isAuthenticated && !isLoading && (
              <Link
                href="/login"
                className="lg:hidden px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
              {t("auth.login")}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu - Only show when authenticated */}
        {mobileMenuOpen && isAuthenticated && (
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
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  pathname === "/admin"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {t("nav.admin")}
              </Link>
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 mt-2 pt-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {user?.name || user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  <FaSignOutAlt />
                  {t("auth.logout")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

export default Navbar;
