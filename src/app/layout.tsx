import type { Metadata } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
export const dynamic = 'force-dynamic';

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jbmono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoalCage — Real Stakes. Real Football.",
  description:
    "Enter eFootball tournaments, put your Cage Coins on the line, and climb the ladder from Bronze to Optimus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${inter.variable} ${jbmono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-pitch text-text">
        <Nav />
        {children}
      </body>
    </html>
  );
}
