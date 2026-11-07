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
      setError("Máº­t kháº©u xĂ¡c nháº­n khĂ´ng khá»›p.");
      return;
    }

    if (password.length < 6) {
      setError("Máº­t kháº©u pháº£i cĂ³ Ă­t nháº¥t 6 kĂ½ tá»±.");
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
      setError(err.message || "ÄÄƒng kĂ½ khĂ´ng thĂ nh cĂ´ng. Vui lĂ²ng thá»­ láº¡i.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-950 p-4 relative">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white font-black shadow-lg shadow-red-900/60">
            <CircleDot className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            ROYAL <span className="text-red-500">BILLIARDS</span>
          </span>
        </Link>
        <p className="text-xs text-zinc-400">Táº¡o tĂ i khoáº£n Ä‘á»ƒ theo dĂµi lá»‹ch Ä‘áº·t vĂ  hÆ°á»Ÿng Æ°u Ä‘Ă£i</p>
      </div>

      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-white">ÄÄƒng KĂ½ ThĂ nh ViĂªn</CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Tráº£i nghiá»‡m dá»‹ch vá»¥ Ä‘áº·t bĂ n bi-da cao cáº¥p trá»±c tuyáº¿n
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
                Há» vĂ  tĂªn
              </label>
              <Input
                placeholder="Nguyá»…n VÄƒn An"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Äá»‹a chá»‰ Email
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
                Sá»‘ Ä‘iá»‡n thoáº¡i
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
                Máº­t kháº©u (tá»‘i thiá»ƒu 6 kĂ½ tá»±)
              </label>
              <Input
                type="password"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                XĂ¡c nháº­n máº­t kháº©u
              </label>
              <Input
                type="password"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full text-sm font-semibold mt-3">
              HoĂ n Táº¥t ÄÄƒng KĂ½
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-4">
          <p className="text-xs text-zinc-400">
            ÄĂ£ cĂ³ tĂ i khoáº£n?{" "}
            <Link href="/login" className="text-red-400 hover:underline font-semibold">
              ÄÄƒng nháº­p ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

