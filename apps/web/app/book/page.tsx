"use client";

import { useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
  Receipt,
  QrCode,
  Coffee,
  UtensilsCrossed,
  UserCheck,
  Plus,
  Minus,
  Check,
  User,
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

interface ServiceItem {
  id: string;
  code: string;
  name: string;
  category: "DRINK" | "FOOD" | "SNACK" | "COMBO" | "OTHER";
  unitPrice: number;
  unit: string;
  stockQuantity: number;
  imageUrl?: string;
}

interface StaffOption {
  id: string;
  fullName: string;
  phone?: string;
}

function BookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTableId = searchParams.get("tableId");
  const { user } = useAuth();

  // Khá»Ÿi táº¡o ngĂ y máº·c Ä‘á»‹nh lĂ  hĂ´m nay theo giá» Ä‘á»‹a phÆ°Æ¡ng
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>("18:00");
  const [durationMinutes, setDurationMinutes] = useState<number>(120);
  const [selectedTable, setSelectedTable] = useState<AvailableTable | null>(null);
  const [notes, setNotes] = useState<string>("");

  // Tráº¡ng thĂ¡i chá»n Ä‘á»“ uá»‘ng & mĂ³n Äƒn trÆ°á»›c
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("ALL");

  // Tráº¡ng thĂ¡i yĂªu cáº§u nhĂ¢n viĂªn phá»¥c vá»¥ / xáº¿p bi
  const [requestedStaffRole, setRequestedStaffRole] = useState<"" | "BALL_RACKER" | "TABLE_ATTENDANT">("");
  const [requestedStaffId, setRequestedStaffId] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  // TĂ­nh ISO Start Time theo giá» Ä‘á»‹a phÆ°Æ¡ng Viá»‡t Nam (trĂ¡nh lá»‡ch 7 tiáº¿ng UTC)
  const computedStartTime = useMemo(() => {
    if (!date || !time) return "";
    const localDate = new Date(`${date}T${time}:00`);
    return isNaN(localDate.getTime()) ? "" : localDate.toISOString();
  }, [date, time]);

  // Query tĂ¬m bĂ n trá»‘ng
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

  // Query menu Ä‘á»“ uá»‘ng / mĂ³n Äƒn
  const { data: services = [], isLoading: isLoadingServices } = useQuery<ServiceItem[]>({
    queryKey: ["services-menu"],
    queryFn: () => apiClient("/services"),
  });

  // Query danh sĂ¡ch nhĂ¢n viĂªn phá»¥c vá»¥
  const { data: staffOptions = [] } = useQuery<StaffOption[]>({
    queryKey: ["staff-options"],
    queryFn: () => apiClient("/bookings/staff-options"),
  });

  // Cáº­p nháº­t sá»‘ lÆ°á»£ng mĂ³n Äƒn
  const updateServiceQty = (serviceId: string, delta: number) => {
    setSelectedServices((prev) => {
      const curr = prev[serviceId] || 0;
      const next = Math.max(0, curr + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  // Lá»c mĂ³n theo danh má»¥c
  const filteredServices = useMemo(() => {
    if (serviceCategoryFilter === "ALL") return services;
    return services.filter((s) => s.category === serviceCategoryFilter);
  }, [services, serviceCategoryFilter]);

  // TĂ­nh tiá»n mĂ³n Ä‘Ă£ chá»n
  const preOrderedTotal = useMemo(() => {
    return Object.entries(selectedServices).reduce((sum, [sId, qty]) => {
      const svc = services.find((s) => s.id === sId);
      return sum + (svc ? Number(svc.unitPrice) * qty : 0);
    }, 0);
  }, [selectedServices, services]);

  const totalPreOrderedItemsCount = useMemo(() => {
    return Object.values(selectedServices).reduce((sum, qty) => sum + qty, 0);
  }, [selectedServices]);

  // PhĂ­ nhĂ¢n viĂªn phá»¥c vá»¥
  const staffFee = useMemo(() => {
    if (requestedStaffRole === "TABLE_ATTENDANT") return 50000;
    if (requestedStaffRole === "BALL_RACKER") return 30000;
    return 0;
  }, [requestedStaffRole]);

  // Tá»•ng cá»™ng dá»± kiáº¿n
  const tableEstimatedPrice = selectedTable?.slot.estimatedPrice || 0;
  const grandTotalEstimate = tableEstimatedPrice + preOrderedTotal + staffFee;

  // Mutation Ä‘áº·t bĂ n
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTable) throw new Error("Vui lĂ²ng chá»n bĂ n");

      const preOrderedPayload = Object.entries(selectedServices)
        .filter(([_, qty]) => qty > 0)
        .map(([serviceId, quantity]) => ({ serviceId, quantity }));

      return apiClient("/bookings", {
        method: "POST",
        body: JSON.stringify({
          billiardTableId: selectedTable.id,
          startTime: computedStartTime,
          durationMinutes,
          notes,
          preOrderedServices: preOrderedPayload.length > 0 ? preOrderedPayload : undefined,
          requestedStaffRole: requestedStaffRole || undefined,
          requestedStaffId: requestedStaffId || undefined,
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
          "Khung giá» nĂ y vá»«a cĂ³ ngÆ°á»i Ä‘áº·t trÆ°á»›c! Vui lĂ²ng chá»n bĂ n khĂ¡c hoáº·c Ä‘iá»u chá»‰nh khung giá».",
        );
      } else {
        setErrorMessage(err.message || "ÄĂ£ xáº£y ra lá»—i khi táº¡o Ä‘áº·t bĂ n.");
      }
    },
  });

  const handleOpenConfirm = () => {
    if (!selectedTable) {
      setErrorMessage("Vui lĂ²ng chá»n 1 bĂ n bi-da cĂ²n trá»‘ng á»Ÿ BÆ°á»›c 2 trÆ°á»›c khi tiáº¿p tá»¥c.");
      return;
    }
    setErrorMessage(null);

    if (!user) {
      router.push("/login?redirect=/book");
      return;
    }

    setConfirmModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" className="text-xs">Trá»±c Tuyáº¿n 24/7</Badge>
            <span className="text-xs text-zinc-400">Giá»¯ bĂ n tá»©c thĂ¬ â€¢ Nháº­n phĂ²ng Ä‘Ăºng giá»</span>
          </div>
          <h1 className="text-3xl font-black text-white">Äáº¶T BĂ€N BI-DA & PHá»¤C Vá»¤ TRá»°C TUYáº¾N</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Chá»n bĂ n, Ä‘áº·t trÆ°á»›c Ä‘á»“ uá»‘ng / mĂ³n Äƒn vĂ  yĂªu cáº§u nhĂ¢n viĂªn xáº¿p bi, trá»£ lĂ½ bĂ n chuyĂªn nghiá»‡p.
          </p>
        </div>

        {/* Step 1: Chá»n thá»i gian */}
        <Card className="border-zinc-800 bg-zinc-900/70 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <Calendar className="h-5 w-5" />
              BÆ°á»›c 1: Chá»n NgĂ y, Giá» Báº¯t Äáº§u & Thá»i LÆ°á»£ng ChÆ¡i
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  NgĂ y chÆ¡i
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
                  Giá» báº¯t Ä‘áº§u (08:00 - 23:00)
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Thá»i lÆ°á»£ng dá»± kiáº¿n
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={60}>1 tiáº¿ng (60 phĂºt)</option>
                  <option value={90}>1.5 tiáº¿ng (90 phĂºt)</option>
                  <option value={120}>2 tiáº¿ng (120 phĂºt)</option>
                  <option value={180}>3 tiáº¿ng (180 phĂºt)</option>
                  <option value={240}>4 tiáº¿ng (240 phĂºt)</option>
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
              <span className="font-bold">LÆ°u Ă½: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Step 2: Chá»n bĂ n kháº£ dá»¥ng */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-400" />
              BÆ°á»›c 2: Chá»n BĂ n Kháº£ Dá»¥ng Trong Khung Giá» NĂ y
            </h2>
            <span className="text-xs text-zinc-400">
              TĂ¬m tháº¥y <strong className="text-red-400">{availableTables.length}</strong> bĂ n trá»‘ng
            </span>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse"
                />
              ))}
            </div>
          ) : availableTables.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-zinc-800 bg-zinc-900/30">
              <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-bold text-zinc-200">KhĂ´ng cĂ³ bĂ n nĂ o trá»‘ng trong khung giá» nĂ y</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Khung giá» {time} ngĂ y {date} hiá»‡n táº¡i Ä‘Ă£ kĂ­n lá»‹ch. Vui lĂ²ng chá»n má»™t giá» báº¯t Ä‘áº§u khĂ¡c hoáº·c chá»n ngĂ y khĂ¡c.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableTables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const isPreselected = preselectedTableId === table.id && !selectedTable;

                return (
                  <Card
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={`cursor-pointer border transition-all relative overflow-hidden ${
                      isSelected
                        ? "border-red-500 bg-red-950/20 ring-2 ring-red-500 shadow-lg shadow-red-950/50"
                        : isPreselected
                        ? "border-zinc-700 bg-zinc-900/80 ring-1 ring-red-500/50"
                        : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-600 hover:bg-zinc-900"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-red-500 text-zinc-950 rounded-full p-1 shadow">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    )}
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xl font-black text-white">{table.tableNumber}</span>
                          <span className="text-[11px] font-semibold text-red-400">
                            {formatVND(table.tableType.hourlyRate)}/h
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-zinc-300">
                          {table.tableType.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Khu vá»±c:{" "}
                          <span className="text-zinc-200 font-medium">
                            {table.area === "VIP" ? "PhĂ²ng VIP" : "Khu ThÆ°á»ng"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-zinc-400">Táº¡m tĂ­nh giá»:</div>
                          <div className="text-sm font-extrabold text-red-400">
                            {formatVND(table.slot.estimatedPrice)}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant={isSelected ? "primary" : "outline"}
                          className={`text-xs h-7 px-3 ${isSelected ? "bg-red-600 text-white" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTable(table);
                          }}
                        >
                          {isSelected ? "ÄĂ£ Chá»n" : "Chá»n BĂ n NĂ y"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Chá»n Äá»“ Uá»‘ng & MĂ³n Ä‚n TrÆ°á»›c */}
        <Card className="border-zinc-800 bg-zinc-900/70 mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-400">
                <UtensilsCrossed className="h-5 w-5" />
                BÆ°á»›c 3: Chá»n Äá»“ Uá»‘ng & MĂ³n Ä‚n Chuáº©n Bá»‹ Sáºµn (TĂ¹y Chá»n)
              </CardTitle>
              {totalPreOrderedItemsCount > 0 && (
                <Badge variant="success" className="text-xs self-start sm:self-auto">
                  ÄĂ£ chá»n {totalPreOrderedItemsCount} mĂ³n ({formatVND(preOrderedTotal)})
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Äá»“ uá»‘ng vĂ  thá»©c Äƒn sáº½ Ä‘Æ°á»£c nhĂ¢n viĂªn chuáº©n bá»‹ sáºµn sĂ ng ngay khi báº¡n Ä‘áº¿n nháº­n bĂ n.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-zinc-800/80 pb-3">
              {[
                { id: "ALL", label: "Táº¥t cáº£" },
                { id: "DRINK", label: "đŸ¥¤ Äá»“ uá»‘ng" },
                { id: "FOOD", label: "đŸœ MĂ³n Äƒn" },
                { id: "SNACK", label: "đŸ¿ Ä‚n váº·t" },
                { id: "COMBO", label: "âœ¨ Combo" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setServiceCategoryFilter(tab.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    serviceCategoryFilter === tab.id
                      ? "bg-red-600 text-white shadow"
                      : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            {isLoadingServices ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-zinc-800/40 animate-pulse" />
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                KhĂ´ng cĂ³ mĂ³n nĂ o trong danh má»¥c nĂ y.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredServices.map((svc) => {
                  const qty = selectedServices[svc.id] || 0;
                  return (
                    <div
                      key={svc.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        qty > 0
                          ? "border-red-500/80 bg-red-950/20"
                          : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="font-semibold text-xs text-white line-clamp-1">{svc.name}</h4>
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                            {svc.unit}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-red-400">
                          {formatVND(svc.unitPrice)}
                        </div>
                      </div>

                      {/* Stepper +/- */}
                      <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">
                          {qty > 0 ? `${qty} ${svc.unit}` : "ChÆ°a chá»n"}
                        </span>
                        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            disabled={qty === 0}
                            onClick={() => updateServiceQty(svc.id, -1)}
                            className="h-6 w-6 rounded flex items-center justify-center text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateServiceQty(svc.id, 1)}
                            className="h-6 w-6 rounded flex items-center justify-center text-red-400 hover:bg-zinc-800"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: YĂªu Cáº§u NhĂ¢n ViĂªn Phá»¥c Vá»¥ / Xáº¿p Bi */}
        <Card className="border-zinc-800 bg-zinc-900/70 mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <UserCheck className="h-5 w-5" />
              BÆ°á»›c 4: Äáº·t NhĂ¢n ViĂªn Phá»¥c Vá»¥ / Xáº¿p Bi Táº­n BĂ n (TĂ¹y Chá»n)
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-1">
              Báº¡n cĂ³ thá»ƒ tá»± chÆ¡i hoáº·c chá»n nhĂ¢n viĂªn chuyĂªn trĂ¡ch Ä‘á»ƒ cĂ³ tráº£i nghiá»‡m tráº­n Ä‘áº¥u tá»‘t nháº¥t.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Tá»± chÆ¡i */}
              <div
                onClick={() => {
                  setRequestedStaffRole("");
                  setRequestedStaffId("");
                }}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  requestedStaffRole === ""
                    ? "border-red-500 bg-red-950/20 ring-1 ring-red-500"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Tá»± ChÆ¡i Thoáº£i MĂ¡i</span>
                  <Badge variant="outline" className="text-[10px]">Máº·c Ä‘á»‹nh</Badge>
                </div>
                <div className="text-xs text-red-400 font-extrabold mb-1">Miá»…n phĂ­ (0 â‚«)</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Báº¡n tá»± xáº¿p bi, quáº§y phá»¥c vá»¥ chung há»— trá»£ khi cáº§n gá»i thĂªm dá»‹ch vá»¥.
                </p>
              </div>

              {/* Option 2: Xáº¿p bi riĂªng */}
              <div
                onClick={() => setRequestedStaffRole("BALL_RACKER")}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  requestedStaffRole === "BALL_RACKER"
                    ? "border-red-500 bg-red-950/20 ring-1 ring-red-500"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Xáº¿p Bi RiĂªng</span>
                  <Badge variant="info" className="text-[10px]">+30.000 â‚«</Badge>
                </div>
                <div className="text-xs text-red-400 font-extrabold mb-1">30.000 â‚« / lÆ°á»£t</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  NhĂ¢n viĂªn Ä‘á»©ng cáº¡nh xáº¿p bi liĂªn tá»¥c, nhanh chĂ³ng vĂ  chuáº©n xĂ¡c Ä‘á»ƒ vĂ¡n Ä‘áº¥u liá»n máº¡ch.
                </p>
              </div>

              {/* Option 3: Trá»£ lĂ½ bĂ n */}
              <div
                onClick={() => setRequestedStaffRole("TABLE_ATTENDANT")}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  requestedStaffRole === "TABLE_ATTENDANT"
                    ? "border-red-500 bg-red-950/20 ring-1 ring-red-500"
                    : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">Trá»£ LĂ½ & Phá»¥c Vá»¥ VIP</span>
                  <Badge variant="warning" className="text-[10px]">+50.000 â‚«</Badge>
                </div>
                <div className="text-xs text-red-400 font-extrabold mb-1">50.000 â‚« / lÆ°á»£t</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Phá»¥c vá»¥ toĂ n diá»‡n: xáº¿p bi, lau cÆ¡, rĂ³t nÆ°á»›c, order mĂ³n vĂ  chÄƒm sĂ³c suá»‘t buá»•i chÆ¡i.
                </p>
              </div>
            </div>

            {/* Staff Selector Dropdown (náº¿u cĂ³ chá»n phá»¥c vá»¥) */}
            {requestedStaffRole !== "" && (
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Chá»n nhĂ¢n viĂªn báº¡n muá»‘n (TĂ¹y chá»n):
                </label>
                <select
                  value={requestedStaffId}
                  onChange={(e) => setRequestedStaffId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">QuĂ¡n tá»± sáº¯p xáº¿p nhĂ¢n viĂªn trong ca (KhuyĂªn dĂ¹ng)</option>
                  {staffOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} {st.phone ? `(${st.phone})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400">
                  Há»‡ thá»‘ng sáº½ thĂ´ng bĂ¡o ngay tá»›i nhĂ¢n viĂªn Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh khi báº¡n táº¡o Ä‘Æ¡n thĂ nh cĂ´ng.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating/Bottom Summary Bar */}
        <div className="sticky bottom-4 z-20">
          <Card className="border-red-500/50 bg-zinc-900/95 backdrop-blur shadow-2xl shadow-red-950/60">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs w-full md:w-auto">
                <div>
                  <span className="text-zinc-400 block text-[11px]">BĂ n Ä‘Ă£ chá»n:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedTable ? `${selectedTable.tableNumber} (${selectedTable.tableType.name})` : "ChÆ°a chá»n bĂ n"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 block text-[11px]">Äá»“ Äƒn / nÆ°á»›c:</span>
                  <span className="font-semibold text-zinc-200">
                    {totalPreOrderedItemsCount > 0 ? `${totalPreOrderedItemsCount} mĂ³n (${formatVND(preOrderedTotal)})` : "KhĂ´ng"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 block text-[11px]">Phá»¥c vá»¥ bĂ n:</span>
                  <span className="font-semibold text-zinc-200">
                    {requestedStaffRole === "TABLE_ATTENDANT"
                      ? `Trá»£ lĂ½ VIP (${formatVND(staffFee)})`
                      : requestedStaffRole === "BALL_RACKER"
                      ? `Xáº¿p bi riĂªng (${formatVND(staffFee)})`
                      : "Tá»± chÆ¡i (0 â‚«)"}
                  </span>
                </div>

                <div className="pt-2 md:pt-0 md:pl-4 md:border-l border-zinc-800">
                  <span className="text-zinc-400 block text-[11px]">Tá»•ng dá»± kiáº¿n:</span>
                  <span className="text-xl font-black text-red-400">
                    {formatVND(grandTotalEstimate)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleOpenConfirm}
                disabled={!selectedTable}
                className="w-full md:w-auto px-6 h-11 bg-red-600 hover:bg-red-500 font-bold text-sm shrink-0"
              >
                Tiáº¿p Tá»¥c XĂ¡c Nháº­n Äáº·t BĂ n <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="XĂ¡c Nháº­n Äáº·t BĂ n & Dá»‹ch Vá»¥"
        description="Vui lĂ²ng kiá»ƒm tra láº¡i chi tiáº¿t Ä‘áº·t bĂ n vĂ  cĂ¡c dá»‹ch vá»¥ báº¡n Ä‘Ă£ chá»n."
      >
        {selectedTable && (
          <div className="space-y-4 text-xs">
            {/* Chi tiáº¿t Ä‘Æ¡n */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">BĂ n Ä‘Ă£ chá»n:</span>
                <span className="font-bold text-white text-sm">
                  {selectedTable.tableNumber} - {selectedTable.tableType.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Thá»i gian chÆ¡i:</span>
                <span className="font-semibold text-zinc-200">
                  {time} - {date} ({durationMinutes} phĂºt)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tiá»n giá» Æ°á»›c tĂ­nh:</span>
                <span className="font-semibold text-white">
                  {formatVND(tableEstimatedPrice)}
                </span>
              </div>

              {/* MĂ³n Äƒn Ä‘á»“ uá»‘ng */}
              {totalPreOrderedItemsCount > 0 && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                  <div className="text-[11px] font-semibold text-red-400">
                    Äá»“ uá»‘ng & MĂ³n Äƒn Ä‘Ă£ gá»i ({totalPreOrderedItemsCount} mĂ³n):
                  </div>
                  {Object.entries(selectedServices).map(([sId, qty]) => {
                    const svc = services.find((s) => s.id === sId);
                    if (!svc || qty <= 0) return null;
                    return (
                      <div key={sId} className="flex justify-between text-zinc-300 text-[11px]">
                        <span>
                          {qty}x {svc.name}
                        </span>
                        <span>{formatVND(Number(svc.unitPrice) * qty)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Phá»¥c vá»¥ bĂ n */}
              {requestedStaffRole !== "" && (
                <div className="pt-2 border-t border-zinc-800/80 flex justify-between text-sky-300">
                  <div>
                    <div className="font-semibold">
                      {requestedStaffRole === "TABLE_ATTENDANT" ? "Trá»£ lĂ½ & Phá»¥c vá»¥ VIP" : "NhĂ¢n viĂªn xáº¿p bi riĂªng"}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {requestedStaffId
                        ? `Chá»‰ Ä‘á»‹nh: ${staffOptions.find((s) => s.id === requestedStaffId)?.fullName || "NhĂ¢n viĂªn"}`
                        : "QuĂ¡n tá»± sáº¯p xáº¿p nhĂ¢n viĂªn trong ca"}
                    </div>
                  </div>
                  <span className="font-bold">{formatVND(staffFee)}</span>
                </div>
              )}

              {/* Tá»•ng cá»™ng */}
              <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm">
                <span className="font-bold text-zinc-300">Tá»•ng thanh toĂ¡n dá»± kiáº¿n:</span>
                <span className="font-black text-red-400">
                  {formatVND(grandTotalEstimate)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Ghi chĂº (náº¿u cĂ³):</label>
              <Input
                placeholder="VD: Chuáº©n bá»‹ 2 cÆ¡ thi Ä‘áº¥u, khÄƒn láº¡nh..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] leading-relaxed">
              â ï¸ <strong>LÆ°u Ă½:</strong> QuĂ¡n sáº½ giá»¯ bĂ n tá»‘i Ä‘a 15 phĂºt sau giá» háº¹n. Báº¡n cĂ³ thá»ƒ tá»± há»§y miá»…n phĂ­ trÆ°á»›c giá» chÆ¡i Ă­t nháº¥t 60 phĂºt.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalOpen(false)}
              >
                Quay láº¡i
              </Button>
              <Button
                size="sm"
                isLoading={bookingMutation.isPending}
                onClick={() => bookingMutation.mutate()}
                className="bg-red-600 hover:bg-red-500 font-bold"
              >
                XĂ¡c Nháº­n Äáº·t BĂ n Ngay
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={Boolean(successBooking)}
        onClose={() => setSuccessBooking(null)}
        title="đŸ‰ Äáº·t BĂ n ThĂ nh CĂ´ng!"
      >
        <div className="text-center py-2 space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-sm">
            <CheckCircle className="h-5 w-5" />
            <span>ÄÆ¡n Ä‘áº·t cá»§a báº¡n Ä‘Ă£ Ä‘Æ°á»£c xĂ¡c nháº­n thĂ nh cĂ´ng!</span>
          </div>

          {/* QR Code Bill Tra Cá»©u */}
          {successBooking && (
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-2xl inline-block shadow-xl shadow-red-950/40 border-2 border-red-500/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    typeof window !== "undefined"
                      ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH !== undefined ? process.env.NEXT_PUBLIC_BASE_PATH : "/huynhchivi/doan"}/live-bill?code=${encodeURIComponent(successBooking.bookingCode)}`
                      : `/live-bill?code=${encodeURIComponent(successBooking.bookingCode)}`
                  )}`}
                  alt="MĂ£ QR Tra Cá»©u Bill"
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-zinc-400">
                  đŸ“± DĂ¹ng camera Ä‘iá»‡n thoáº¡i quĂ©t mĂ£ QR Ä‘á»ƒ tra cá»©u & xem bill trá»±c tiáº¿p:
                </div>
                <div className="inline-block px-3 py-1 bg-red-950/80 border border-red-700/60 rounded-lg text-sm font-black text-red-400 tracking-wider">
                  {successBooking.bookingCode}
                </div>
              </div>
            </div>
          )}

          {/* ThĂ´ng tin tĂ³m táº¯t Ä‘Æ¡n Ä‘áº·t */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-400">BĂ n Ä‘Ă£ Ä‘áº·t:</span>
              <strong className="text-white font-semibold">
                BĂ n {selectedTable?.tableNumber} ({selectedTable?.tableType?.name})
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Khung giá» háº¹n:</span>
              <span className="text-red-400 font-medium">
                {time} - {date} ({durationMinutes} phĂºt)
              </span>
            </div>
            {totalPreOrderedItemsCount > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Äá»“ Äƒn / nÆ°á»›c Ä‘Ă£ gá»i:</span>
                <span className="text-zinc-200 font-medium">
                  {totalPreOrderedItemsCount} mĂ³n ({formatVND(preOrderedTotal)})
                </span>
              </div>
            )}
            {requestedStaffRole !== "" && (
              <div className="flex justify-between">
                <span className="text-zinc-400">NhĂ¢n viĂªn phá»¥c vá»¥:</span>
                <span className="text-sky-300 font-medium">
                  {requestedStaffRole === "TABLE_ATTENDANT" ? "Trá»£ lĂ½ VIP (50k)" : "Xáº¿p bi (30k)"}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-zinc-800">
              <span className="text-zinc-400">Tá»•ng thanh toĂ¡n dá»± kiáº¿n:</span>
              <strong className="text-amber-400 font-bold">
                {formatVND(successBooking?.estimatedPrice || grandTotalEstimate)}
              </strong>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
            <Link
              href={`/live-bill?code=${encodeURIComponent(successBooking?.bookingCode || "")}`}
              target="_blank"
              className="flex-1"
            >
              <Button size="sm" className="w-full bg-red-600 hover:bg-red-500 font-bold gap-1.5 text-xs h-9">
                <Receipt className="h-4 w-4" />
                Má»Ÿ Xem Bill Trá»±c Tiáº¿p
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-9"
              onClick={() => {
                setSuccessBooking(null);
                router.push("/customer/dashboard");
              }}
            >
              Xem Lá»‹ch Äáº·t Cá»§a TĂ´i
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
          Äang táº£i thĂ´ng tin Ä‘áº·t bĂ n...
        </div>
      }
    >
      <BookContent />
    </Suspense>
  );
}
