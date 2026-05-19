import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/shared/header";
import { CartProvider } from "@/components/shared/cart-provider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["cyrillic"],
  weight: ['400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: "Лидер Продукт",
  description: "Быстрая доставка продуктов",
  icons: {
    icon: "/logo-lp.svg",
    shortcut: "/logo-lp.svg",
    apple: "/logo-lp.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body className={nunito.className} suppressHydrationWarning>
        <CartProvider>
          <main className="min-h-screen">
            <Header/>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
