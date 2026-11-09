"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CircleDot, ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        fullName,
        email,
        phone,
        password,
      });
    } catch (err: any) {
      setError(err.message || "Đăng ký không thành công. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-950 p-4 relative">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black shadow-lg shadow-emerald-900/60">
            <CircleDot className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            ROYAL <span className="text-emerald-500">BILLIARDS</span>
          </span>
        </Link>
        <p className="text-xs text-zinc-400">Tạo tài khoản để theo dõi lịch đặt và hưởng ưu đãi</p>
      </div>

      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-white">Đăng Ký Thành Viên</CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Trải nghiệm dịch vụ đặt bàn bi-da cao cấp trực tuyến
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-rose-800/80 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Họ và tên
              </label>
              <Input
                placeholder="Nguyễn Văn An"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Địa chỉ Email
              </label>
              <Input
                type="email"
                placeholder="khachhang@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Số điện thoại
              </label>
              <Input
                type="tel"
                placeholder="0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Xác nhận mật khẩu
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full text-sm font-semibold mt-3">
              Hoàn Tất Đăng Ký
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-4">
          <p className="text-xs text-zinc-400">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
              Đăng nhập ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

