import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config/site";
import { appCredits } from "@/lib/config/credits";
import { AppProviders } from "@/providers/app-providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: appCredits.creator }],
  creator: appCredits.creator,
  publisher: appCredits.creator,
  generator: `${siteConfig.name} by ${appCredits.creator}`,
  keywords: [
    "Absensi CN",
    "SMK Citra Negara",
    "sistem absensi sekolah",
    appCredits.creator,
  ],
  other: {
    author: appCredits.creator,
    copyright: appCredits.copyright,
    "application-credit": appCredits.statement,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
