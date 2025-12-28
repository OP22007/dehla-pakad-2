import type { Metadata } from "next";
import { Playfair_Display, Inter, Crimson_Pro } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Court Piece - Premium Casino",
  description: "Experience the classic game of Court Piece in a premium casino setting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} ${crimson.variable} antialiased bg-casino-green-900 text-gold-100`}
      >
        {children}
      </body>
    </html>
  );
}
