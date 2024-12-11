import type { Metadata } from "next";
import localFont from "next/font/local";
import { Neonderthaw, Kablammo, Lugrasimo} from 'next/font/google';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const lugrasimo = Lugrasimo({
  weight: '400',
  subsets: ['latin'],
});

const kablammo = Kablammo({
  weight: '400',
  subsets: ['latin'],
  style: ['normal'],
});

export const metadata: Metadata = {
  title: "Pattern-Memory-Game",
  description: "Two Player Patter memory game!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >{children}
      </body> 
    </html>
  );
}
