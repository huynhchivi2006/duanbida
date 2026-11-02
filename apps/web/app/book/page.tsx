"use client";

import { useState, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AvailableTable {
  id: string;
  tableNumber: string;
  area: "STANDARD" | "VIP" | "OUTDOOR";
  tableType: {
    id: string;
    code: string;
    name: string;
    hourlyRate: number;
  };
  slot: {
    startTime: string;
    endTime: string;
    durationMinutes: number;
    estimatedPrice: number;
  };
}

function BookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTableId = searchParams.get("tableId");
  const { user } = useAuth();

  // Khởi tạo ngày mặc định là hôm nay
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>("18:00");
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [selectedTable, setSelectedTable] = useState<AvailableTable | null>(null);
  const [notes, setNotes] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  // Tính ISO Start Time
  const computedStartTime = `${date}T${time}:00Z`;

  // Query tìm bàn trống
  const {
    data: availableTables = [],
    isLoading: isSearching,
    refetch,
  } = useQuery<AvailableTable[]>({
    queryKey: ["available-tables", computedStartTime, durationMinutes],
    queryFn: () =>
      apiClient("/tables/available", {
        params: {
          startTime: computedStartTime,
          durationMinutes,
        },
      }),
    enabled: Boolean(date && time),
  });

  // Mutation đặt bàn
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTable) throw new Error("Vui lòng chọn bàn");
      return apiClient("/bookings", {
        method: "POST",
        body: JSON.stringify({
          billiardTableId: selectedTable.id,
          startTime: computedStartTime,
          durationMinutes,
          notes,
        }),
      });
    },
    onSuccess: (data) => {
      setConfirmModalOpen(false);
      setSuccessBooking(data);
      refetch();
    },
    onError: (err: any) => {
      setConfirmModalOpen(false);
      if (err.statusCode === 409) {
        setErrorMessage(
          "Khung giờ này vừa có người đặt trước! Vui lòng chọn bàn khác hoặc điều chỉnh khung giờ.",
        );
      } else {
        setErrorMessage(err.message || "Đã xảy ra lỗi khi tạo đặt bàn.");
      }
    },
  });

  const handleStartBooking = (table: AvailableTable) => {
    setSelectedTable(table);
    setErrorMessage(null);

    if (!user) {
      // Chuyển hướng đến đăng nhập nếu chưa đăng nhập
      router.push("/login?redirect=/book");
      return;
    }

    setConfirmModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">ĐẶT BÀN BI-DA TRỰC TUYẾN</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Chọn ngày, giờ và thời lượng. Hệ thống sẽ kiểm tra và khóa bàn chống trùng ngay lập tức.
            </p>
          </div>

          {/* Step 1: Chọn thời gian */}
          <Card className="border-zinc-800 bg-zinc-900/70 mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                <Calendar className="h-5 w-5" />
                Bước 1: Chọn Ngày, Giờ Bắt Đầu & Thời Lượng Chơi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Ngày chơi
                  </label>
                  <Input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Giờ bắt đầu (08:00 - 23:00)
                  </label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Thời lượng dự kiến
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={60}>1 tiếng (60 phút)</option>
                    <option value={90}>1.5 tiếng (90 phút)</option>
                    <option value={120}>2 tiếng (120 phút)</option>
                    <option value={180}>3 tiếng (180 phút)</option>
                    <option value={240}>4 tiếng (240 phút)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl border border-rose-800/80 bg-rose-950/40 text-rose-300 flex items-start gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Thông báo: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Step 2: Danh sách bàn còn trống */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                Bước 2: Chọn Bàn Khả Dụng Trong Khung Giờ Này
              </h2>
              <span className="text-xs text-zinc-400">
                Tìm thấy{" "}
                <strong className="text-emerald-400">{availableTables.length}</strong> bàn trống
              </span>
            </div>

            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-36 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse"
                  />
                ))}
              </div>
            ) : availableTables.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-zinc-800 bg-zinc-900/30">
                <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h3 className="font-bold text-zinc-200">Không có bàn nào trống trong khung giờ này</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Khung giờ {time} ngày {date} hiện tại đã kín lịch. Vui lòng chọn một giờ bắt đầu khác hoặc chọn ngày khác.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTables.map((table) => {
                  const isPreselected = preselectedTableId === table.id;
                  return (
                    <Card
                      key={table.id}
                      className={`border-zinc-800 bg-zinc-900/70 hover:border-emerald-500/60 transition-all ${
                        isPreselected ? "ring-2 ring-emerald-500" : ""
                      }`}
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl font-black text-white">
                              {table.tableNumber}
                            </span>
                            <Badge variant="success">Khả dụng</Badge>
                          </div>
                          <div className="text-sm font-semibold text-zinc-200">
                            {table.tableType.name}
                          </div>
                          <div className="text-xs text-zinc-400 mt-1">
                            Khu vực:{" "}
                            <span className="text-zinc-200">
                              {table.area === "VIP" ? "Phòng VIP" : "Khu Thường"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-zinc-400">Chi phí dự kiến:</div>
                            <div className="text-base font-extrabold text-emerald-400">
                              {formatVND(table.slot.estimatedPrice)}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleStartBooking(table)}
                            className="text-xs"
                          >
                            Xác Nhận Đặt Bàn <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác Nhận Đặt Bàn"
        description="Kiểm tra lại thông tin trước khi hoàn tất đặt chỗ."
      >
        {selectedTable && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Bàn đã chọn:</span>
                <span className="font-bold text-white text-sm">
                  {selectedTable.tableNumber} ({selectedTable.tableType.name})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Ngày chơi:</span>
                <span className="font-semibold text-zinc-200">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Khung giờ:</span>
                <span className="font-semibold text-zinc-200">
                  {time} ({durationMinutes} phút)
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-800">
                <span className="text-zinc-400">Ước tính thanh toán:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {formatVND(selectedTable.slot.estimatedPrice)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Ghi chú (nếu có):</label>
              <Input
                placeholder="VD: Cần 2 cơ thi đấu, chuẩn bị sẵn khăn lạnh..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] leading-relaxed">
              ⚠️ <strong>Lưu ý:</strong> Quán sẽ giữ bàn tối đa 15 phút sau giờ hẹn. Bạn có thể tự hủy miễn phí trước giờ chơi ít nhất 60 phút.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                isLoading={bookingMutation.isPending}
                onClick={() => bookingMutation.mutate()}
              >
                Hoàn Tất Đặt Bàn
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={Boolean(successBooking)}
        onClose={() => setSuccessBooking(null)}
        title="Đặt Bàn Thành Công!"
      >
        <div className="text-center py-4 space-y-3">
          <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-white">Khung giờ của bạn đã được đảm bảo!</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Mã đặt bàn của bạn:
          </p>
          <div className="inline-block px-4 py-2 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-lg font-black text-emerald-400 tracking-wider">
            {successBooking?.bookingCode}
          </div>
          <p className="text-[11px] text-zinc-500">
            Vui lòng lưu lại mã này hoặc xuất trình khi đến quầy check-in.
          </p>

          <div className="pt-4 flex justify-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setSuccessBooking(null);
                router.push("/customer/dashboard");
              }}
            >
              Xem Lịch Đặt Của Tôi
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
          Đang tải thông tin đặt bàn...
        </div>
      }
    >
      <BookContent />
    </Suspense>
  );
}
