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
    refetchInterval: 10000, // Tá»± Ä‘á»™ng cáº­p nháº­t sá»‘ liá»‡u má»—i 10 giĂ¢y
  });

  // Äá»“ng há»“ Ä‘áº¿m thá»i gian chÆ¡i theo thá»i gian thá»±c (giĂ¢y)
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
          <div className="h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Äang táº£i hĂ³a Ä‘Æ¡n & thĂ´ng tin bĂ n...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-center">
        <Card className="max-w-md w-full p-6 border-zinc-800 bg-zinc-900/80 space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">KhĂ´ng TĂ¬m Tháº¥y BĂ n Hoáº·c HĂ³a ÄÆ¡n</h2>
          <p className="text-xs text-zinc-400">
            Há»‡ thá»‘ng khĂ´ng tĂ¬m tháº¥y hĂ³a Ä‘Æ¡n hay phiĂªn chÆ¡i tÆ°Æ¡ng á»©ng vá»›i mĂ£{" "}
            <span className="font-mono text-red-400 font-semibold">{queryCode}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => refetch()}
              className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thá»­ táº£i láº¡i dá»¯ liá»‡u
            </button>
            <a
              href="/"
              className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
            >
              Vá» Trang Chá»§
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
            <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white">
              <CircleDot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white">ROYAL BILLIARDS</div>
              <div className="text-[10px] text-red-400 font-semibold uppercase">
                HĂ³a ÄÆ¡n & TiĂªu DĂ¹ng Trá»±c Tiáº¿p
              </div>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? "animate-spin text-red-400" : ""}`} />
            LĂ m má»›i
          </button>
        </div>

        {/* Card Tráº¡ng ThĂ¡i BĂ n */}
        <Card className="border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden">
          <div className={`h-1.5 w-full ${isPlaying ? "bg-rose-500 animate-pulse" : "bg-red-500"}`} />
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider block">BĂ n Bi-Da</span>
                <span className="text-2xl font-black text-white">{data.tableNumber}</span>
              </div>
              <Badge variant={isPlaying ? "danger" : data.status === "PAID" ? "success" : "info"} className="text-xs">
                {isPlaying
                  ? "ÄANG CHÆ I TĂNH GIá»œ"
                  : data.status === "PAID"
                  ? "ÄĂƒ THANH TOĂN"
                  : data.status === "CONFIRMED"
                  ? "ÄĂƒ GIá»® CHá»– (CHá»œ CHECK-IN)"
                  : data.status === "CHECKED_IN"
                  ? "ÄĂƒ CHECK-IN (Sáº®P Báº®T Äáº¦U)"
                  : "HĂ“A ÄÆ N Äáº¶T TRÆ¯á»C"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800/60">
              <div>
                <span className="text-[11px] text-zinc-500 block">Loáº¡i bĂ n:</span>
                <span className="font-semibold text-zinc-200">{data.tableType}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">ÄÆ¡n giĂ¡ giá»:</span>
                <span className="font-bold text-red-400">{formatVND(data.hourlyRate)}/h</span>
              </div>
            </div>

            {/* Äá»“ng há»“ thá»i gian thá»±c */}
            {isPlaying && (
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <Clock className="h-4 w-4 text-rose-400 animate-spin" />
                  <span>Thá»i gian Ä‘Ă£ chÆ¡i:</span>
                </div>
                <div className="font-mono text-xl font-black text-white tracking-wider">
                  {formatTimer(secondsElapsed)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Chi Tiáº¿t TiĂªu DĂ¹ng */}
        <Card className="border-zinc-800 bg-zinc-900/70 p-5 space-y-4 text-xs">
          <div className="font-bold text-zinc-200 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-red-400" />
            Chi Tiáº¿t TiĂªu DĂ¹ng BĂ n Hiá»‡n Táº¡i
          </div>

          <div className="space-y-2 divide-y divide-zinc-800/60">
            {/* Tiá»n giá» chÆ¡i */}
            <div className="pt-2 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">
                  Tiá»n giá» bĂ n {data.tableNumber} {data.elapsedMinutes > 0 ? `(${data.elapsedMinutes} phĂºt)` : "(Táº¡m tĂ­nh Ä‘áº·t trÆ°á»›c)"}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {data.elapsedMinutes > 0 ? "LĂ m trĂ²n block 5 phĂºt (Tá»‘i thiá»ƒu 30p)" : "Dá»± kiáº¿n theo thá»i lÆ°á»£ng Ä‘áº·t bĂ n"}
                </div>
              </div>
              <div className="font-bold text-white text-sm">
                {formatVND(data.baseTableAmount)}
              </div>
            </div>

            {/* Phá»¥ thu ngĂ y Lá»… / Chá»§ Nháº­t (náº¿u cĂ³) */}
            {data.surchargeAmount > 0 && (
              <div className="pt-2 flex justify-between items-center text-amber-300">
                <div>
                  <div className="font-semibold">{data.surchargeNote || "Phá»¥ thu ngĂ y cao Ä‘iá»ƒm"}</div>
                  <div className="text-[11px] text-amber-400/80">Ăp dá»¥ng theo quy Ä‘á»‹nh cĂ¢u láº¡c bá»™</div>
                </div>
                <div className="font-bold text-sm">+{formatVND(data.surchargeAmount)}</div>
              </div>
            )}

            {/* NhĂ¢n viĂªn phá»¥c vá»¥ náº¿u cĂ³ */}
            {data.staffAssignments?.map((staff: any, idx: number) => (
              <div key={idx} className="pt-2 flex justify-between items-center text-sky-300">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-semibold">{staff.role}: {staff.name}</div>
                    <div className="text-[11px] text-zinc-400">NhĂ¢n viĂªn phá»¥c vá»¥ táº­n bĂ n</div>
                  </div>
                </div>
                <div className="font-bold text-sm">
                  {staff.fee > 0 ? formatVND(staff.fee) : "Miá»…n phĂ­"}
                </div>
              </div>
            ))}

            {/* Äá»“ Äƒn / NÆ°á»›c uá»‘ng Ä‘Ă£ gá»i */}
            {data.orderedItems
              ?.filter((it: any) => it.type === "SERVICE" || !it.type)
              .map((it: any, idx: number) => (
                <div key={it.id || idx} className="pt-2 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-zinc-100">{it.name || it.serviceName}</div>
                    <div className="text-[11px] text-zinc-400">
                      SL: {it.quantity} {it.unitPrice ? `Ă— ${formatVND(it.unitPrice)}` : ""}
                    </div>
                  </div>
                  <div className="font-bold text-zinc-200">{formatVND(it.subtotal)}</div>
                </div>
              ))}
          </div>

          {/* Tá»•ng tiá»n táº¡m tĂ­nh */}
          <div className="pt-4 border-t border-zinc-800 flex justify-between items-baseline">
            <span className="text-sm font-bold text-zinc-300">
              {isPlaying ? "Táº¡m tĂ­nh thá»i gian thá»±c:" : "Tá»•ng thanh toĂ¡n:"}
            </span>
            <span className="text-2xl font-black text-red-400">
              {formatVND(data.totalAmount)}
            </span>
          </div>
        </Card>

        {/* Card MĂ£ VietQR Thanh ToĂ¡n NgĂ¢n HĂ ng */}
        <Card className="border-zinc-800 bg-zinc-900/70 p-5 space-y-3 text-center text-xs">
          <div className="font-bold text-zinc-200 flex items-center justify-center gap-1.5">
            <QrCode className="h-4 w-4 text-red-400" />
            MĂ£ QR Chuyá»ƒn Khoáº£n NgĂ¢n HĂ ng (VietQR)
          </div>
          <p className="text-[11px] text-zinc-400">
            QuĂ©t mĂ£ báº±ng app ngĂ¢n hĂ ng (Vietcombank, MB, Techcombank, MoMo...) Ä‘á»ƒ thanh toĂ¡n tá»± Ä‘á»™ng:
          </p>

          <div className="p-3 bg-white rounded-xl inline-block shadow-lg mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.vietQrUrl}
              alt="MĂ£ QR Chuyá»ƒn Khoáº£n VietQR"
              className="w-48 h-48 object-contain mx-auto"
            />
          </div>

          <div className="text-[11px] text-zinc-400 space-y-0.5">
            <div>Chá»§ tĂ i khoáº£n: <strong className="text-zinc-200">HUYNH CHI VI</strong></div>
            <div>NgĂ¢n hĂ ng: <strong className="text-zinc-200">MB Bank (QuĂ¢n Äá»™i) - 0978580607</strong></div>
            <div>Ná»™i dung CK: <strong className="text-red-400">ROYAL_{data.sessionCode || data.tableNumber}</strong></div>
          </div>
        </Card>
      </div>

      <footer className="text-center py-4 text-[11px] text-zinc-500 border-t border-zinc-900 max-w-md mx-auto w-full">
        ROYAL BILLIARDS CLUB â€¢ Há»‡ thá»‘ng Ä‘áº·t bĂ n & quáº£n lĂ½ chuyĂªn nghiá»‡p
      </footer>
    </div>
  );
}

export default function LiveBillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LiveBillContent />
    </Suspense>
  );
}

