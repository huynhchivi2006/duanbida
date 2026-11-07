import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  title: "Royal Billiards - Há»‡ Thá»‘ng Quáº£n LĂ½ Äáº·t BĂ n Bi-da Cao Cáº¥p",
  description: "Äáº·t bĂ n bi-da trá»±c tuyáº¿n theo thá»i gian thá»±c, chá»‘ng trĂ¹ng lá»‹ch tuyá»‡t Ä‘á»‘i, tra cá»©u bĂ n trá»‘ng vĂ  thanh toĂ¡n nhanh chĂ³ng.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased selection:bg-red-500 selection:text-white">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

