import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Article Website - Modern Article Platform",
  description: "A modern article platform built with Next.js. Write, edit, and share your stories with the world.",
  keywords: "article, articles, writing, nextjs, react",
  authors: [{ name: "Article Website" }],
  openGraph: {
    title: "Article Website",
    description: "A modern article platform built with Next.js",
    type: "website",
  },
};

const themeInitializer = `
(function () {
  try {
    const storedTheme = window.localStorage.getItem('article-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : (prefersDark ? 'dark' : 'light');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (error) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
