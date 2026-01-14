import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google"; // Premium modern fonts
import { CompanyProvider } from "@/context/CompanyContext";
import { AppConfigProvider } from "@/context/AppConfigContext";
import { AgentChat } from "@/components/agent/AgentChat";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: "300", // Light weight as requested
  display: "swap",
});

export const metadata: Metadata = {
  title: "Labery Beauty App Suite",
  description: "Advanced cosmetic production suite",
};

import { auth } from "@/auth";

import { SessionProvider } from "next-auth/react";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="es" className={`${outfit.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          <CompanyProvider allowedCompanyIds={session?.user?.companies}>
            <AppConfigProvider>
              {children}
            </AppConfigProvider>
            {/* <AgentChat /> */}
          </CompanyProvider>
        </SessionProvider>
      </body>
    </html >
  );
}
