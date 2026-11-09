"use client";

import { useState, useEffect } from "react";
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
  ChevronRight,
  Percent,
  Award,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { NotificationCenter } from "../notifications/notification-center";

interface SidebarProps {
  role: "ADMIN" | "STAFF" | "CUSTOMER";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Khôi phục trạng thái thu gọn từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem("billiards_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("billiards_sidebar_collapsed", String(next));
      return next;
    });
  };

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
    <aside
      className={cn(
        "relative border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between min-h-screen text-zinc-300 transition-all duration-300 ease-in-out shrink-0 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Nút Toggle Phóng to / Thu vào hình tròn ở mép Sidebar */}
      <button
        onClick={toggleCollapse}
        title={isCollapsed ? "Mở rộng thanh menu (Phóng ra)" : "Thu gọn thanh menu (Thu vào)"}
        className="absolute -right-3.5 top-6 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-zinc-800 shadow-md shadow-black/40 transition-all duration-200"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <div>
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-zinc-800 transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              onClick={isCollapsed ? toggleCollapse : undefined}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/60 transition-transform",
                isCollapsed && "cursor-pointer hover:scale-105"
              )}
            >
              <CircleDot className="h-5 w-5" />
            </div>

            {!isCollapsed && (
              <div className="whitespace-nowrap overflow-hidden">
                <div className="font-extrabold text-sm tracking-wider font-azonix text-zinc-100">
                  ROYAL BILLIARDS
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                  Cổng Quản Trị {role}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              title="Thu gọn thanh menu"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className={cn("space-y-1 transition-all duration-300", isCollapsed ? "p-2" : "p-3")}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all group",
                  isCollapsed
                    ? "justify-center p-2.5 h-11 w-full"
                    : "gap-3 px-3.5 py-2.5",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-zinc-400"
                  )}
                />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className={cn("border-t border-zinc-800 space-y-2 transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
        {/* Real-time Notification Center */}
        <NotificationCenter isCollapsed={isCollapsed} />

        {/* User Card */}
        {isCollapsed ? (
          <div
            title={`${user?.fullName || "Người dùng"} (${user?.email || ""})`}
            className="flex items-center justify-center h-10 w-full rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-emerald-400"
          >
            <div className="h-7 w-7 rounded-full bg-emerald-900/60 flex items-center justify-center font-bold text-xs text-emerald-300 border border-emerald-500/30">
              {(user?.fullName || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="text-xs font-semibold text-zinc-200 truncate">{user?.fullName}</div>
            <div className="text-[11px] text-zinc-500 truncate">{user?.email}</div>
          </div>
        )}

        {/* Back to Home */}
        <Link
          href="/"
          title={isCollapsed ? "Về Trang Chủ Khách Hàng" : undefined}
          className={cn(
            "flex items-center rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors",
            isCollapsed ? "justify-center p-2.5 h-10 w-full" : "gap-2 px-3 py-2"
          )}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Về Trang Chủ Khách Hàng</span>}
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          title={isCollapsed ? "Đăng Xuất" : undefined}
          className={cn(
            "w-full flex items-center rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors",
            isCollapsed ? "justify-center p-2.5 h-10" : "gap-2 px-3 py-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Đăng Xuất</span>}
        </button>
      </div>
    </aside>
  );
}
