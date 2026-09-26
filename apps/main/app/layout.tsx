import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import { TopProgressBar } from "@/components/top-progress-bar";
import { PWARegister } from "@/components/pwa-register";

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Locketwan Admin",
    template: "%s | Locketwan Admin",
  },
  description: "Locketwan Admin Dashboard",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // statusBarStyle: "black-translucent", //sử dụng notch với PWA
    title: "Locketwan Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <PWARegister />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
