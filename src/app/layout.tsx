import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "./providers";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-var",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trace — Daily Edition",
  description: "All the news fit to read",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
