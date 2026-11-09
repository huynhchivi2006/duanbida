import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { QueryProvider } from "@/lib/query-provider";

export const metadata: Metadata = {
  title: "Royal Billiards - Hệ Thống Quản Lý Đặt Bàn Bi-da Cao Cấp",
  description: "Đặt bàn bi-da trực tuyến theo thời gian thực, chống trùng lịch tuyệt đối, tra cứu bàn trống và thanh toán nhanh chóng.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-red-600 selection:text-white">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

