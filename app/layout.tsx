import "@/styles/global.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { globalCSSVariablesResolver, globalTheme } from "@/theme";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Mono, Lilita_One } from "next/font/google";
import Providers from "@/providers";
const redHatSans = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
});

const redHatMono = Red_Hat_Mono({
  variable: "--font-red-hat-mono",
  subsets: ["latin"],
});

const lilitaOne = Lilita_One({
  variable: "--font-lilita-one",
  subsets: ["latin"],
  weight: "400",
});
const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: "Mezcal",
  description: "A better Runes for Bitcoin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <link rel="icon" href="/favicon.ico" sizes="any" />

      <body
        className={`${redHatSans.variable} ${redHatMono.variable} ${lilitaOne.variable}`}
      >
        <ColorSchemeScript forceColorScheme="dark" />
        <Providers>
          <MantineProvider
            theme={globalTheme}
            cssVariablesResolver={globalCSSVariablesResolver}
            forceColorScheme="dark"
          >
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
