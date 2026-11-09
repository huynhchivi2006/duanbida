"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CircleDot, Lock, Mail, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không chính xác.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-950 p-4 relative">
      <div className="absolute inset-0 bg-radial-gradient from-emerald-950/20 via-transparent to-transparent -z-10" />

      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black shadow-lg shadow-emerald-900/60">
            <CircleDot className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-wider font-azonix text-white">
            ROYAL <span className="text-emerald-500">BILLIARDS</span>
          </span>
        </Link>
        <p className="text-xs text-zinc-400">Hệ Thống Quản Lý Đặt Bàn Bi-da Chuyên Nghiệp</p>
      </div>

      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-white">Đăng Nhập Hệ Thống</CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Truy cập tài khoản cá nhân, quầy thu ngân hoặc bảng quản trị
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-rose-800/80 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Email đăng nhập
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="name@billiards.local"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">Mật khẩu</label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full text-sm font-semibold mt-2">
              Đăng Nhập
            </Button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <div className="text-[11px] font-semibold text-zinc-400 mb-2.5 text-center">
              Tài khoản Demo (1-Click điền thông tin):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@billiards.local", "Admin@123456")}
                className="p-2 rounded-lg border border-amber-800/60 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 text-[11px] font-medium transition-colors text-center"
              >
                👑 Quản Trị Viên (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("staff1@billiards.local", "Staff@123456")}
                className="p-2 rounded-lg border border-sky-800/60 bg-sky-950/30 hover:bg-sky-900/40 text-sky-300 text-[11px] font-medium transition-colors text-center"
              >
                💼 Thu Ngân (Staff 01)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("waiter@billiards.local", "Staff@123456")}
                className="p-2 rounded-lg border border-indigo-800/60 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 text-[11px] font-medium transition-colors text-center"
              >
                🎱 Phục Vụ Bàn (Staff)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("khach1@gmail.com", "Khach@123456")}
                className="p-2 rounded-lg border border-emerald-800/60 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-[11px] font-medium transition-colors text-center"
              >
                👤 Khách Hàng (Customer)
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-4">
          <p className="text-xs text-zinc-400">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-emerald-400 hover:underline font-semibold">
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

