import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "גלשנים – הזמנות סיטונאיות",
  description: "אתר הזמנות סיטונאי ומערכת ניהול לעסק גלשנים",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap"
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
