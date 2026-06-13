import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config/site";
import { appCreditLongStatement, appCreditSummary, appCredits } from "@/lib/config/credits";
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
  manifest: "/manifest.webmanifest",
  authors: [{ name: appCreditSummary }],
  creator: appCreditSummary,
  publisher: appCredits.team,
  generator: `${siteConfig.name} by ${appCredits.team}, led by ${appCreditSummary}`,
  keywords: [
    "Absensi CN",
    "SMK Citra Negara",
    "sistem absensi sekolah",
    appCredits.team,
    appCreditSummary,
    ...appCredits.contributors.map((contributor) => contributor.name),
  ],
  other: {
    author: appCreditSummary,
    team: appCredits.team,
    "lead-creator": appCreditSummary,
    "lead-creator-role": appCredits.leadCreatorFullRole,
    contributors: appCredits.contributors
      .map((contributor) => `${contributor.name} - ${contributor.role}`)
      .join("; "),
    copyright: appCredits.copyright,
    "application-credit": appCreditLongStatement,
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
