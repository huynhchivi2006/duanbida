"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import Link from "next/link";
import { CalendarDays, Clock, Plus, XCircle, AlertCircle, CheckCircle, QrCode, Receipt } from "lucide-react";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [qrModalBooking, setQrModalBooking] = useState<any | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => apiClient("/bookings/my"),
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient(`/bookings/${id}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      setCancelModalBooking(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err: any) => {
      setCancelError(err.message || "KhĂ´ng thá»ƒ há»§y Ä‘áº·t bĂ n");
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge variant="success">ÄĂ£ XĂ¡c Nháº­n (Giá»¯ BĂ n)</Badge>;
      case "CHECKED_IN":
        return <Badge variant="info">ÄĂ£ Check-in</Badge>;
      case "IN_USE":
        return <Badge variant="warning">Äang ChÆ¡i</Badge>;
      case "COMPLETED":
        return <Badge variant="default">HoĂ n Táº¥t</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">ÄĂ£ Há»§y</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="CUSTOMER" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-white">Lá»CH Äáº¶T BĂ€N Cá»¦A TĂ”I</h1>
              <p className="text-zinc-400 text-xs mt-1">
                Xin chĂ o, <strong className="text-red-400">{user?.fullName}</strong>! Báº¡n cĂ³ thá»ƒ theo dĂµi vĂ  quáº£n lĂ½ lá»‹ch Ä‘áº·t táº¡i Ä‘Ă¢y.
              </p>
            </div>

            <Link href="/book">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Äáº·t BĂ n Má»›i
              </Button>
            </Link>
          </div>

          {/* Booking List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card className="text-center py-16 border-zinc-800 bg-zinc-900/40">
              <CalendarDays className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-300">Báº¡n chÆ°a cĂ³ lÆ°á»£t Ä‘áº·t bĂ n nĂ o</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-6">
                HĂ£y Ä‘áº·t bĂ n trÆ°á»›c Ä‘á»ƒ Ä‘áº£m báº£o cĂ³ vá»‹ trĂ­ chÆ¡i Æ°a thĂ­ch khi Ä‘áº¿n quĂ¡n.
              </p>
              <Link href="/book">
                <Button size="sm">Äáº·t BĂ n Ngay</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking: any) => {
                const canCancel =
                  booking.status === "CONFIRMED" || booking.status === "PENDING";
                return (
                  <Card key={booking.id} className="border-zinc-800 bg-zinc-900/60 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-red-400 text-sm">
                            {booking.bookingCode}
                          </span>
                          {statusBadge(booking.status)}
                        </div>
                        <div className="text-sm font-bold text-white">
                          BĂ n {booking.billiardTable?.tableNumber} - {booking.billiardTable?.tableType?.name}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-3">
                          <span>Báº¯t Ä‘áº§u: {formatDateTimeVN(booking.startTime)}</span>
                          <span>â€¢</span>
                          <span>Káº¿t thĂºc: {formatDateTimeVN(booking.endTime)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:border-l sm:border-zinc-800 sm:pl-6">
                        <div>
                          <div className="text-[11px] text-zinc-400">Chi phĂ­ dá»± kiáº¿n:</div>
                          <div className="text-sm font-extrabold text-red-400">
                            {formatVND(booking.estimatedPrice)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1 border-red-700/60 text-red-400 hover:bg-red-950/40"
                            onClick={() => setQrModalBooking(booking)}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            QR Bill
                          </Button>

                          {canCancel && (
                            <Button
                              variant="danger"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                setCancelModalBooking(booking);
                                setCancelError(null);
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Há»§y BĂ n
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Cancel Modal */}
      <Modal
        isOpen={Boolean(cancelModalBooking)}
        onClose={() => setCancelModalBooking(null)}
        title="XĂ¡c Nháº­n Há»§y Äáº·t BĂ n"
        description="Theo chĂ­nh sĂ¡ch cĂ¢u láº¡c bá»™, báº¡n chá»‰ cĂ³ thá»ƒ tá»± há»§y trÆ°á»›c giá» báº¯t Ä‘áº§u Ă­t nháº¥t 60 phĂºt."
      >
        <div className="space-y-4 text-xs">
          {cancelError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300">
              {cancelError}
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              LĂ½ do há»§y Ä‘áº·t bĂ n:
            </label>
            <Input
              placeholder="VD: Thay Ä‘á»•i lá»‹ch trĂ¬nh báº­n viá»‡c..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalBooking(null)}
            >
              Quay láº¡i
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={cancelMutation.isPending}
              disabled={!cancelReason.trim()}
              onClick={() =>
                cancelMutation.mutate({
                  id: cancelModalBooking.id,
                  reason: cancelReason,
                })
              }
            >
              XĂ¡c Nháº­n Há»§y
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR Code Bill Modal */}
      <Modal
        isOpen={Boolean(qrModalBooking)}
        onClose={() => setQrModalBooking(null)}
        title={`MĂ£ QR HĂ³a ÄÆ¡n & Tra Cá»©u - ${qrModalBooking?.bookingCode}`}
      >
        <div className="text-center py-2 space-y-3">
          <div className="p-3 bg-white rounded-2xl inline-block shadow-xl shadow-red-950/40 border-2 border-red-500/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                typeof window !== "undefined"
                  ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH !== undefined ? process.env.NEXT_PUBLIC_BASE_PATH : "/huynhchivi/doan"}/live-bill?code=${encodeURIComponent(qrModalBooking?.bookingCode || "")}`
                  : `/live-bill?code=${encodeURIComponent(qrModalBooking?.bookingCode || "")}`
              )}`}
              alt="MĂ£ QR Tra Cá»©u Bill"
              className="w-48 h-48 object-contain mx-auto"
            />
          </div>

          <p className="text-xs text-zinc-400">
            DĂ¹ng camera Ä‘iá»‡n thoáº¡i quĂ©t mĂ£ QR Ä‘á»ƒ theo dĂµi chi tiáº¿t hĂ³a Ä‘Æ¡n (Live Bill), thá»i gian chÆ¡i vĂ  mĂ£ VietQR thanh toĂ¡n.
          </p>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">BĂ n:</span>
              <strong className="text-white">BĂ n {qrModalBooking?.billiardTable?.tableNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Giá» Ä‘áº·t háº¹n:</span>
              <span className="text-red-400 font-medium">
                {qrModalBooking?.startTime ? formatDateTimeVN(qrModalBooking.startTime) : ""}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <Link
              href={`/live-bill?code=${encodeURIComponent(qrModalBooking?.bookingCode || "")}`}
              target="_blank"
            >
              <Button size="sm" className="bg-red-600 hover:bg-red-500 gap-1.5 text-xs h-9">
                <Receipt className="h-4 w-4" />
                Má»Ÿ Xem Trá»±c Tiáº¿p
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9"
              onClick={() => setQrModalBooking(null)}
            >
              ÄĂ³ng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

