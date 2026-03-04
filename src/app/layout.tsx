import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToastContainer } from "@/components/ui/toast";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/error/error-boundary";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
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
    <ThemeProvider>
      <html lang="es" suppressHydrationWarning>
        <body
          className={`${jakarta.variable} ${mono.variable} antialiased font-sans`}
        >
          <ErrorBoundary
            onError={(error, errorInfo) => {
              // Error boundary raíz - captura errores globales
              console.error('[Root Error Boundary]', error, errorInfo);
            }}
          >
            <div className="flex min-h-screen bg-background overflow-x-hidden">
              <Sidebar />
              <div className="flex-1 ml-0 md:ml-64 w-full">
                <Header />
                <main className="p-4 md:p-6 w-full overflow-x-hidden">
                  {children}
                </main>
              </div>
            </div>
            <ToastContainer />
          </ErrorBoundary>
        </body>
      </html>
    </ThemeProvider>
  );
}
