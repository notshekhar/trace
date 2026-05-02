import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import { ThemeProvider } from "./providers";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif-var",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trace — The daily edition",
  description: "A calm, readable daily edition of the news.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${newsreader.variable} ${inter.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
