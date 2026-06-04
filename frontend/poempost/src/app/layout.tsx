import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; 
import { Great_Vibes, Cinzel_Decorative, Indie_Flower } from "next/font/google";

const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-greatvibes" });
const cinzel = Cinzel_Decorative({ weight: ["400", "700", "900"], subsets: ["latin"], variable: "--font-cinzel" });
const indie = Indie_Flower({ weight: "400", subsets: ["latin"], variable: "--font-indie" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PoemKavi — A Sanctuary for Poetry & Expression",
  description: "Share, discover, and express yourself through beautiful typography and digital poem art. Drag, drop, and immerse in a community of writers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"
    className={`${greatVibes.variable} ${cinzel.variable} ${indie.variable}`}>
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
       <AuthProvider>  {/* This just provides auth context */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
