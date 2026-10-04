import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TopNav } from "@/components/layout/top-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Nami — Suivi anime & manga",
  description:
    "Suivez vos anime et manga, notez-les, classez-les et ne manquez plus aucune sortie.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nami",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
  modal,
}: LayoutProps<"/"> & { modal: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${anton.variable} ${manrope.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TopNav />
          <MobileHeader />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <BottomTabBar />
          {modal}
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
