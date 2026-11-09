"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { CircleDot, User, LogOut, LayoutDashboard, Calendar, Compass, Shield } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-black shadow-md shadow-emerald-900/50">
            <CircleDot className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-zinc-100">
              ROYAL <span className="text-emerald-500">BILLIARDS</span>
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
              Club & Lounge
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            Trang Chủ
          </Link>
          <Link href="/tables" className="hover:text-emerald-400 transition-colors">
            Bàn & Giá Thuê
          </Link>
          <Link href="/book" className="hover:text-emerald-400 transition-colors">
            Đặt Bàn Trực Tuyến
          </Link>
          <Link href="/lookup" className="hover:text-emerald-400 transition-colors">
            Tra Cứu Lịch Đặt
          </Link>
        </nav>

        {/* User / Auth Action */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs">
                  {user.fullName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-medium text-xs leading-none">{user.fullName}</div>
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold mt-0.5">
                    {user.role}
                  </div>
                </div>
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl z-50 text-xs"
                  onClick={() => setDropdownOpen(false)}
                >
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      <Shield className="h-4 w-4 text-amber-400" />
                      Trang Quản Trị (Admin)
                    </Link>
                  )}
                  {isStaff && (
                    <Link
                      href="/staff/dashboard"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4 text-sky-400" />
                      Bàn Thu Ngân (Staff)
                    </Link>
                  )}
                  <Link
                    href="/customer/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    Lịch Đặt Của Tôi
                  </Link>
                  <Link
                    href="/customer/profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <User className="h-4 w-4 text-zinc-400" />
                    Hồ Sơ Cá Nhân
                  </Link>

                  <div className="my-1 border-t border-zinc-800"></div>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-rose-400 hover:bg-rose-950/30"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng Xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Đăng Nhập
                </Button>
              </Link>
              <Link href="/book">
                <Button variant="primary" size="sm">
                  Đặt Bàn Ngay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

