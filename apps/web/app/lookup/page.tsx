"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import { Search, Calendar, Clock, MapPin, Receipt, CheckCircle, AlertTriangle, QrCode } from "lucide-react";

function LookupContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = async (searchCode: string) => {
    if (!searchCode.trim()) return;

    setIsLoading(true);
    setError(null);
    setBooking(null);

    try {
      const data = await apiClient(`/bookings/${encodeURIComponent(searchCode.trim())}`);
      setBooking(data);
    } catch (err: any) {
      setError("KhĂ´ng tĂ¬m tháº¥y thĂ´ng tin Ä‘áº·t bĂ n vá»›i mĂ£ nĂ y. Vui lĂ²ng kiá»ƒm tra láº¡i chĂ­nh xĂ¡c mĂ£ Ä‘áº·t bĂ n.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      executeSearch(initialCode.trim());
    }
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(code);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">ÄĂ£ XĂ¡c Nháº­n (Giá»¯ BĂ n)</Badge>;
      case "CHECKED_IN":
        return <Badge variant="info">ÄĂ£ Check-in Quáº§y</Badge>;
      case "IN_USE":
        return <Badge variant="warning">Äang Trong LÆ°á»£t ChÆ¡i</Badge>;
      case "COMPLETED":
        return <Badge variant="default">ÄĂ£ HoĂ n Táº¥t</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">ÄĂ£ Há»§y</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Tra Cá»©u Lá»‹ch Äáº·t & HĂ³a ÄÆ¡n Trá»±c Tuyáº¿n
        </h1>
        <p className="text-sm text-zinc-400">
          Nháº­p mĂ£ Ä‘áº·t bĂ n cá»§a báº¡n (VD: BKG-20261102-1234) hoáº·c quĂ©t mĂ£ QR Ä‘á»ƒ kiá»ƒm tra thĂ´ng tin vĂ  theo dĂµi giá» chÆ¡i
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60 shadow-xl mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Nháº­p mĂ£ Ä‘áº·t bĂ n (VD: BKG-20261102-XXXX)..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 h-11 bg-zinc-950 font-mono text-sm"
              />
            </div>
            <Button type="submit" isLoading={isLoading} className="h-11 px-6 font-semibold">
              Tra Cá»©u
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-3 mb-8">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {booking && (
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl overflow-hidden animate-fade-in">
          <CardHeader className="border-b border-zinc-800 bg-zinc-950/50 p-6 flex flex-row items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400 font-medium">MĂ£ Ä‘áº·t bĂ n</div>
              <div className="font-mono text-xl font-black text-red-400 tracking-wider">
                {booking.bookingCode}
              </div>
            </div>
            <div>{statusBadge(booking.status)}</div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="text-xs text-zinc-500 font-medium">BĂ n bi-da</div>
                <div className="text-base font-bold text-white">
                  BĂ n {booking.billiardTable?.tableNumber}
                </div>
                <div className="text-xs text-red-400">
                  {booking.billiardTable?.tableType?.name}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="text-xs text-zinc-500 font-medium">KhĂ¡ch hĂ ng</div>
                <div className="text-base font-bold text-white">
                  {booking.customer?.fullName}
                </div>
                <div className="text-xs text-zinc-400">
                  {booking.customer?.phone || booking.customer?.email}
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  Giá» háº¹n báº¯t Ä‘áº§u:
                </span>
                <span className="font-semibold text-zinc-200">
                  {formatDateTimeVN(booking.startTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  Giá» háº¹n káº¿t thĂºc:
                </span>
                <span className="font-semibold text-zinc-200">
                  {formatDateTimeVN(booking.endTime)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-zinc-400">Táº¡m tĂ­nh giá» chÆ¡i:</span>
                <span className="font-bold text-red-400 text-sm">
                  {formatVND(booking.estimatedPrice)}
                </span>
              </div>
            </div>

            {/* Action Buttons: Xem Live Bill & VietQR */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/live-bill?code=${encodeURIComponent(booking.bookingCode)}`}
                target="_blank"
                className="flex-1"
              >
                <Button className="w-full bg-red-600 hover:bg-red-500 font-bold gap-2 text-xs h-11 shadow-lg shadow-red-950/50">
                  <Receipt className="h-4 w-4" />
                  Xem HĂ³a ÄÆ¡n Trá»±c Tiáº¿p (Live Bill & VietQR)
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function LookupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex-1">
        <Suspense
          fallback={
            <div className="max-w-2xl mx-auto text-center py-12 text-zinc-500 text-xs">
              Äang táº£i trang tra cá»©u...
            </div>
          }
        >
          <LookupContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
