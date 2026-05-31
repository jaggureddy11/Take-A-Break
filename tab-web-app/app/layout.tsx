import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import RoleSimulator from "@/components/RoleSimulator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "TAB (Take A Breath) - Get a Dude. Find a Home.",
  description: "TAB (Take A Breath) is Bengaluru's premier bounty-based PG scouting platform. Raise a bounty, let a local Dude inspect PG rooms, run Wi-Fi tests, and audit food hygiene.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <RoleSimulator />
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
