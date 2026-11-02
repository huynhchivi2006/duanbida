"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import { Search, Calendar, Clock, MapPin, Receipt, CheckCircle, AlertTriangle } from "lucide-react";

export default function LookupPage() {
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setBooking(null);

    try {
      const data = await apiClient(`/bookings/${code.trim()}`);
      setBooking(data);
    } catch (err: any) {
      setError("Không tìm thấy thông tin đặt bàn với mã này. Vui lòng kiểm tra lại chính xác mã đặt bàn.");
    } finally {
      setIsLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">Đã Xác Nhận (Giữ Bàn)</Badge>;
      case "CHECKED_IN":
        return <Badge variant="info">Đã Check-in Quầy</Badge>;
      case "IN_USE":
        return <Badge variant="warning">Đang Trong Lượt Chơi</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Đã Hoàn Tất</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Đã Hủy</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white">TRA CỨU LỊCH ĐẶT BÀN</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Nhập mã đặt bàn của bạn (VD: BKG-20261026-0001) để xem chi tiết trạng thái.
            </p>
          </div>

          {/* Form tìm kiếm */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-6 mb-8">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Nhập mã đặt bàn (BKG-...)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button type="submit" isLoading={isLoading} className="shrink-0 px-6">
                <Search className="h-4 w-4 mr-2" />
                Tra Cứu
              </Button>
            </form>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2 mb-6">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              {error}
            </div>
          )}

          {/* Booking Result */}
          {booking && (
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <div className="text-xs text-zinc-400">Mã Đặt Bàn</div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {booking.bookingCode}
                  </div>
                </div>
                {statusBadge(booking.status)}
              </CardHeader>

              <CardContent className="pt-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <span className="text-zinc-400 block mb-1">Bàn Bi-da:</span>
                    <span className="text-base font-bold text-white block">
                      {booking.billiardTable?.tableNumber}
                    </span>
                    <span className="text-zinc-400">
                      {booking.billiardTable?.tableType?.name}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <span className="text-zinc-400 block mb-1">Khách Hàng:</span>
                    <span className="text-sm font-bold text-white block">
                      {booking.customer?.fullName || "Khách đặt trước"}
                    </span>
                    <span className="text-zinc-400">{booking.customer?.phone}</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      Giờ bắt đầu:
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {formatDateTimeVN(booking.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      Giờ kết thúc:
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {formatDateTimeVN(booking.endTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <span className="text-zinc-400">Chi phí dự kiến:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatVND(booking.estimatedPrice)}
                    </span>
                  </div>
                </div>

                {booking.invoice && (
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        Hóa đơn thanh toán ({booking.invoice.invoiceCode})
                      </div>
                      <div className="text-xs text-zinc-300 mt-0.5">
                        Tổng tiền: {formatVND(booking.invoice.finalAmount)}
                      </div>
                    </div>
                    <Badge variant={booking.invoice.status === "PAID" ? "success" : "warning"}>
                      {booking.invoice.status === "PAID" ? "Đã Thanh Toán" : "Chưa Thanh Toán"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

