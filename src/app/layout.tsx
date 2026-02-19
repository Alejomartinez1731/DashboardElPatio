import type { Metadata } from "next";
import { Playfair_Display, Lora, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// Fuentes del sistema de diseño El Patio Vila-Seca
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const body = Lora({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const elegant = Cormorant_Garamond({
  variable: "--font-elegant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "El Patio & Grill - Dashboard",
  description: "Dashboard de compras y gastos del restaurante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${display.variable} ${body.variable} ${elegant.variable} antialiased`}
        style={{ backgroundColor: '#1a1209', color: '#e8dcc8' }}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Header />
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
