import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import PWAProvider from "@/components/PWAProvider";

export const metadata: Metadata = {
  title: "HISAB — हर पैसे का साफ हिसाब",
  description: "Event-wise Money & Expense Management. Track who gave money, how much was spent, and keep every event's accounting crystal clear.",
  keywords: "hisab, money management, expense tracker, event accounting, hindi, pwa",
  manifest: "./manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HISAB",
  },
  icons: {
    icon: "./favicon.ico",
    apple: "./icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="./manifest.json" />
        <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" />
      </head>
      <body>
        <ToastProvider>
          <PWAProvider>
            {children}
          </PWAProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
