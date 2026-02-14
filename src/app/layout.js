"use client";

import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { OrderProvider } from "@/context/OrderContext";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Hide header on login page
  const hideHeader = pathname === "/login";

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {/* HEADER */}
        {!hideHeader && (
          <header className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-5xl font-extrabold text-blue-400">
                Yahin!
              </h1>
              <p className="text-xs text-gray-500 mt-3">
                Get your favourite clothes delivered in less than 90 minutes
              </p>
            </div>
          </header>
        )}

        {/* PROVIDERS */}
        <OrderProvider>
          <CartProvider>
            {/* PAGE CONTENT */}
            <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
              {children}
            </main>
          </CartProvider>
        </OrderProvider>

        {/* BOTTOM NAVBAR */}
        <Navbar />
      </body>
    </html>
  );
}