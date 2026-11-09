"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import {
  CircleDot,
  Clock,
  UtensilsCrossed,
  UserCheck,
  Receipt,
  QrCode,
  Sparkles,
  AlertCircle,
  RefreshCw,
  PhoneCall,
} from "lucide-react";

function LiveBillContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || searchParams.get("booking") || "";
  const tableParam = searchParams.get("table") || "";
  const sessionParam = searchParams.get("session") || "";
  const invoiceParam = searchParams.get("invoice") || "";

  const queryCode = codeParam || tableParam || sessionParam || invoiceParam || "B01";

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["live-bill", queryCode],
    queryFn: () => apiClient(`/invoices/live/${encodeURIComponent(queryCode)}`),
    refetchInterval: 10000, // Tự động cập nhật số liệu mỗi 10 giây
  });

  // Đồng hồ đếm thời gian chơi theo thời gian thực (giây)
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (data?.startTime && data?.status === "PLAYING") {
      const startMs = new Date(data.startTime).getTime();
      const updateTimer = () => {
        const diffSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setSecondsElapsed(diffSec);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [data?.startTime, data?.status]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Đang tải hóa đơn & thông tin bàn...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-center">
        <Card className="max-w-md w-full p-6 border-zinc-800 bg-zinc-900/80 space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Không Tìm Thấy Bàn Hoặc Hóa Đơn</h2>
          <p className="text-xs text-zinc-400">
            Hệ thống không tìm thấy hóa đơn hay phiên chơi tương ứng với mã{" "}
            <span className="font-mono text-emerald-400 font-semibold">{queryCode}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => refetch()}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử tải lại dữ liệu
            </button>
            <a
              href="/"
              className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
            >
              Về Trang Chủ
            </a>
          </div>
        </Card>
      </div>
    );
  }

  const isPlaying = data.status === "PLAYING";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <div className="max-w-md mx-auto w-full space-y-4 pb-12">
        {/* Brand Banner */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white">
              <CircleDot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white">ROYAL BILLIARDS</div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">
                Hóa Đơn & Tiêu Dùng Trực Tiếp
              </div>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin text-emerald-400" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Card Trạng Thái Bàn */}
        <Card className="border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden">
          <div className={`h-1.5 w-full ${isPlaying ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block">Bàn Bi-Da</span>
                <span className="text-2xl font-black text-white">{data.tableNumber}</span>
              </div>
              <Badge variant={isPlaying ? "danger" : data.status === "PAID" ? "success" : "info"} className="text-xs">
                {isPlaying
                  ? "ĐANG CHƠI TÍNH GIỜ"
                  : data.status === "PAID"
                  ? "ĐÃ THANH TOÁN"
                  : data.status === "CONFIRMED"
                  ? "ĐÃ GIỮ CHỖ (CHỜ CHECK-IN)"
                  : data.status === "CHECKED_IN"
                  ? "ĐÃ CHECK-IN (SẮP BẮT ĐẦU)"
                  : "HÓA ĐƠN ĐẶT TRƯỚC"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800/60">
              <div>
                <span className="text-[11px] text-zinc-500 block">Loại bàn:</span>
                <span className="font-semibold text-zinc-200">{data.tableType}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Đơn giá giờ:</span>
                <span className="font-bold text-emerald-400">{formatVND(data.hourlyRate)}/h</span>
              </div>
            </div>

            {/* Đồng hồ thời gian thực */}
            {isPlaying && (
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <Clock className="h-4 w-4 text-rose-400 animate-spin" />
                  <span>Thời gian đã chơi:</span>
                </div>
                <div className="font-mono text-xl font-black text-white tracking-wider">
                  {formatTimer(secondsElapsed)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Chi Tiết Tiêu Dùng */}
        <Card className="border-zinc-800 bg-zinc-900/70 p-5 space-y-4 text-xs">
          <div className="font-bold text-zinc-200 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" />
            Chi Tiết Tiêu Dùng Bàn Hiện Tại
          </div>

          <div className="space-y-2 divide-y divide-zinc-800/60">
            {/* Tiền giờ chơi */}
            <div className="pt-2 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">
                  Tiền giờ bàn {data.tableNumber} {data.elapsedMinutes > 0 ? `(${data.elapsedMinutes} phút)` : "(Tạm tính đặt trước)"}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {data.elapsedMinutes > 0 ? "Làm tròn block 5 phút (Tối thiểu 30p)" : "Dự kiến theo thời lượng đặt bàn"}
                </div>
              </div>
              <div className="font-bold text-white text-sm">
                {formatVND(data.baseTableAmount)}
              </div>
            </div>

            {/* Phụ thu ngày Lễ / Chủ Nhật (nếu có) */}
            {data.surchargeAmount > 0 && (
              <div className="pt-2 flex justify-between items-center text-amber-300">
                <div>
                  <div className="font-semibold">{data.surchargeNote || "Phụ thu ngày cao điểm"}</div>
                  <div className="text-[11px] text-amber-400/80">Áp dụng theo quy định câu lạc bộ</div>
                </div>
                <div className="font-bold text-sm">+{formatVND(data.surchargeAmount)}</div>
              </div>
            )}

            {/* Nhân viên phục vụ nếu có */}
            {data.staffAssignments?.map((staff: any, idx: number) => (
              <div key={idx} className="pt-2 flex justify-between items-center text-sky-300">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-semibold">{staff.role}: {staff.name}</div>
                    <div className="text-[11px] text-zinc-400">Nhân viên phục vụ tận bàn</div>
                  </div>
                </div>
                <div className="font-bold text-sm">
                  {staff.fee > 0 ? formatVND(staff.fee) : "Miễn phí"}
                </div>
              </div>
            ))}

            {/* Đồ ăn / Nước uống đã gọi */}
            {data.orderedItems
              ?.filter((it: any) => it.type === "SERVICE" || !it.type)
              .map((it: any, idx: number) => (
                <div key={it.id || idx} className="pt-2 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-zinc-100">{it.name || it.serviceName}</div>
                    <div className="text-[11px] text-zinc-400">
                      SL: {it.quantity} {it.unitPrice ? `× ${formatVND(it.unitPrice)}` : ""}
                    </div>
                  </div>
                  <div className="font-bold text-zinc-200">{formatVND(it.subtotal)}</div>
                </div>
              ))}
          </div>

          {/* Tổng tiền tạm tính */}
          <div className="pt-4 border-t border-zinc-800 flex justify-between items-baseline">
            <span className="text-sm font-bold text-zinc-300">
              {isPlaying ? "Tạm tính thời gian thực:" : "Tổng thanh toán:"}
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {formatVND(data.totalAmount)}
            </span>
          </div>
        </Card>

        {/* Card Mã VietQR Thanh Toán Ngân Hàng */}
        <Card className="border-zinc-800 bg-zinc-900/70 p-5 space-y-3 text-center text-xs">
          <div className="font-bold text-zinc-200 flex items-center justify-center gap-1.5">
            <QrCode className="h-4 w-4 text-emerald-400" />
            Mã QR Chuyển Khoản Ngân Hàng (VietQR)
          </div>
          <p className="text-[11px] text-zinc-400">
            Quét mã bằng app ngân hàng (Vietcombank, MB, Techcombank, MoMo...) để thanh toán tự động:
          </p>

          <div className="p-3 bg-white rounded-xl inline-block shadow-lg mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.vietQrUrl}
              alt="Mã QR Chuyển Khoản VietQR"
              className="w-48 h-48 object-contain mx-auto"
            />
          </div>

          <div className="text-[11px] text-zinc-400 space-y-0.5">
            <div>Chủ tài khoản: <strong className="text-zinc-200">HUYNH CHI VI</strong></div>
            <div>Ngân hàng: <strong className="text-zinc-200">MB Bank (Quân Đội) - 0978580607</strong></div>
            <div>Nội dung CK: <strong className="text-emerald-400">ROYAL_{data.sessionCode || data.tableNumber}</strong></div>
          </div>
        </Card>
      </div>

      <footer className="text-center py-4 text-[11px] text-zinc-500 border-t border-zinc-900 max-w-md mx-auto w-full">
        ROYAL BILLIARDS CLUB • Hệ thống đặt bàn & quản lý chuyên nghiệp
      </footer>
    </div>
  );
}

export default function LiveBillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LiveBillContent />
    </Suspense>
  );
}

