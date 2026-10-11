import type { Metadata, Viewport } from "next";
import { Vazirmatn, Noto_Sans_JP } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ServiceWorkerRegister } from "@/components/celestial/ServiceWorkerRegister";
import "./globals.css";

// Persian + Latin — Vazirmatn has full Latin coverage, acts as the base font
const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// Japanese — CJK fonts are large; preload disabled and all subsets included
const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Celestial — A journey through time",
  description:
    "Celestial is a multi-calendar web app: Gregorian, Shamsi (Jalali) and the Persian Imperial calendar side by side, with international, US, Japanese and Persian events in English, Japanese and فارسی.",
  applicationName: "Celestial",
  keywords: [
    "calendar",
    "multi-calendar",
    "jalali",
    "shamsi",
    "persian imperial",
    "hijri",
    "تقویم",
    "カレンダー",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo.svg" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Celestial",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF7" },
    { media: "(prefers-color-scheme: dark)", color: "#15130F" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${vazir.variable} ${notoJp.variable} bg-background text-foreground font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
