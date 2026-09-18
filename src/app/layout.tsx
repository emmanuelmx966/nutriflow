import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriFlow — Secure Nutrition Tracker",
  description:
    "Track calories, macros, exercise, water, weight & intermittent fasting. A secure, reliable, offline-ready nutrition PWA.",
  keywords: [
    "nutrition",
    "calorie counter",
    "macro tracker",
    "food diary",
    "exercise log",
    "fasting tracker",
    "PWA",
  ],
  authors: [{ name: "NutriFlow" }],
  applicationName: "NutriFlow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriFlow",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon-192.svg", sizes: "192x192" }],
  },
  openGraph: {
    title: "NutriFlow — Secure Nutrition Tracker",
    description:
      "Track calories, macros, exercise, water, weight & intermittent fasting. Secure, reliable, offline-ready PWA.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f9d6b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <ServiceWorkerRegister />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
