"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  TableProperties,
  Receipt,
  UtensilsCrossed,
  Users,
  BarChart3,
  CircleDot,
  LogOut,
  ChevronLeft,
  Percent,
  Award,
  Ticket,
  Gift,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  role: "ADMIN" | "STAFF" | "CUSTOMER";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const adminLinks = [
    { href: "/admin/dashboard", label: "Tổng Quan (Dashboard)", icon: LayoutDashboard },
    { href: "/admin/tables", label: "Quản Lý Bàn & Giá Giờ", icon: TableProperties },
    { href: "/admin/pricing-rules", label: "Phụ Thu Ngày Lễ & CN", icon: Percent },
    { href: "/admin/membership", label: "Hội Viên & Đổi Quà", icon: Award },
    { href: "/admin/vouchers", label: "Voucher & Khuyến Mãi", icon: Ticket },
    { href: "/admin/bookings", label: "Quản Lý Đặt Bàn", icon: CalendarDays },
    { href: "/admin/services", label: "Menu Dịch Vụ & Đồ Uống", icon: UtensilsCrossed },
    { href: "/admin/users", label: "Khách Hàng & Phân Quyền", icon: Users },
    { href: "/admin/reports", label: "Báo Cáo Doanh Thu", icon: BarChart3 },
  ];

  const staffLinks = [
    { href: "/staff/dashboard", label: "Sơ Đồ Bàn Trực Quan", icon: TableProperties },
    { href: "/staff/bookings", label: "Lịch Đặt Trong Ca", icon: CalendarDays },
    { href: "/staff/billing", label: "Thu Ngân & Hóa Đơn", icon: Receipt },
  ];

  const customerLinks = [
    { href: "/customer/dashboard", label: "Lịch Đặt Của Tôi", icon: CalendarDays },
    { href: "/customer/membership", label: "Thẻ Hội Viên & Đổi Quà", icon: Award },
    { href: "/customer/invoices", label: "Lịch Sử Hóa Đơn", icon: Receipt },
    { href: "/customer/profile", label: "Thông Tin Cá Nhân", icon: Users },
  ];

  const links =
    role === "ADMIN" ? adminLinks : role === "STAFF" ? staffLinks : customerLinks;

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between min-h-screen text-zinc-300">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-zinc-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
            <CircleDot className="h-4 w-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-zinc-100">
              ROYAL BILLIARDS
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
              Cổng Quản Trị {role}
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-zinc-400")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
          <div className="text-xs font-semibold text-zinc-200 truncate">{user?.fullName}</div>
          <div className="text-[11px] text-zinc-500 truncate">{user?.email}</div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Về Trang Chủ Khách Hàng
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Đăng Xuất
        </button>
      </div>
    </aside>
  );
}

