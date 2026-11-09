"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import {
  Receipt,
  Plus,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  Eye,
  Award,
  Ticket,
  Search,
  ArrowRightLeft,
  Layers,
  Sparkles,
} from "lucide-react";

export default function StaffBillingPage() {
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Block rounding state
  const [roundingMode, setRoundingMode] = useState<"BLOCK_5" | "BLOCK_15" | "EXACT">("BLOCK_5");

  // Customer membership lookup state
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerInfo, setCustomerInfo] = useState<any | null>(null);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // Switch & Merge table states
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [targetSwitchTableId, setTargetSwitchTableId] = useState("");
  const [targetMergeTableId, setTargetMergeTableId] = useState("");
  const [switchReason, setSwitchReason] = useState("");

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; title: string } | null>(null);

  // 1. Láº¥y danh sĂ¡ch bĂ n Ä‘ang chÆ¡i
  const { data: tables = [], isLoading: isLoadingTables } = useQuery({
    queryKey: ["staff-billing-tables"],
    queryFn: () => apiClient("/tables"),
    refetchInterval: 10000,
  });

  // 2. Láº¥y danh sĂ¡ch dá»‹ch vá»¥ / Ä‘á»“ uá»‘ng
  const { data: services = [] } = useQuery({
    queryKey: ["services-menu"],
    queryFn: () => apiClient("/services"),
  });

  // 3. Tra cá»©u khĂ¡ch hĂ ng theo SÄT
  const handleSearchCustomer = async () => {
    if (!customerPhone.trim()) return;
    setIsSearchingCustomer(true);
    setCustomerSearchError(null);
    try {
      const data = await apiClient(`/users/by-phone/${customerPhone.trim()}`);
      setCustomerInfo(data);
    } catch (err: any) {
      setCustomerInfo(null);
      setCustomerSearchError(err.message || "KhĂ´ng tĂ¬m tháº¥y khĂ¡ch hĂ ng");
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // 4. Kiá»ƒm tra mĂ£ voucher
  const handleValidateVoucher = async () => {
    if (!voucherCode.trim() || !activeSession) return;
    setIsValidatingVoucher(true);
    setVoucherError(null);
    try {
      const rate = Number(activeSession.hourlyRateSnapshot || 80000);
      const estOrderVal = Math.max(100000, rate * 1.5);
      const res = await apiClient("/vouchers/validate", {
        params: {
          code: voucherCode.trim(),
          orderValue: estOrderVal,
        },
      });
      setAppliedVoucher(res);
    } catch (err: any) {
      setAppliedVoucher(null);
      setVoucherError(err.message || "MĂ£ voucher khĂ´ng há»£p lá»‡");
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  // Mutation táº¡o hĂ³a Ä‘Æ¡n káº¿t thĂºc phiĂªn chÆ¡i
  const createInvoiceMutation = useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      return apiClient("/invoices/create-from-session", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          roundingMode,
          customerPhone: customerPhone ? customerPhone.trim() : undefined,
          customerId: customerInfo?.id || undefined,
          voucherCode: appliedVoucher?.voucher?.code || voucherCode || undefined,
          discountAmount: Number(discountAmount) || 0,
        }),
      });
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["staff-billing-tables"] });
      setSelectedInvoice(invoice);
      setActiveSession(null);
      setCustomerInfo(null);
      setCustomerPhone("");
      setVoucherCode("");
      setAppliedVoucher(null);
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi chá»‘t giá»"),
  });

  // Mutation thĂªm dá»‹ch vá»¥ vĂ o hĂ³a Ä‘Æ¡n
  const addServiceMutation = useMutation({
    mutationFn: async ({ invoiceId, serviceId, quantity }: any) => {
      return apiClient(`/invoices/${invoiceId}/add-service`, {
        method: "POST",
        body: JSON.stringify({ serviceId, quantity: Number(quantity) }),
      });
    },
    onSuccess: (updatedInvoice) => {
      setSelectedInvoice(updatedInvoice);
      setSelectedServiceId("");
      setServiceQuantity(1);
    },
  });

  // Mutation gá»i mĂ³n trá»±c tiáº¿p vĂ o phiĂªn chÆ¡i trÆ°á»›c khi chá»‘t hĂ³a Ä‘Æ¡n
  const addSessionOrderMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.id) {
        throw new Error("Vui lĂ²ng chá»n bĂ n Ä‘ang chÆ¡i trÆ°á»›c khi gá»i mĂ³n");
      }
      return apiClient(`/invoices/session/${activeSession.id}/order`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: selectedServiceId,
          quantity: Number(serviceQuantity),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-billing-tables"] });
      setSelectedServiceId("");
      setServiceQuantity(1);
      alert("âœ… ÄĂ£ gá»i mĂ³n vĂ o bĂ n thĂ nh cĂ´ng!");
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi gá»i mĂ³n"),
  });

  // Mutation chuyá»ƒn bĂ n
  const switchTableMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.billiardTableId || !targetSwitchTableId) {
        throw new Error("Vui lĂ²ng chá»n bĂ n Ä‘Ă­ch");
      }
      return apiClient("/tables/switch", {
        method: "POST",
        body: JSON.stringify({
          sourceTableId: activeSession.billiardTableId,
          targetTableId: targetSwitchTableId,
          reason: switchReason || undefined,
        }),
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["staff-billing-tables"] });
      setIsSwitchModalOpen(false);
      setActiveSession(null);
      setTargetSwitchTableId("");
      alert(res?.message || "âœ… Chuyá»ƒn bĂ n thĂ nh cĂ´ng!");
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi chuyá»ƒn bĂ n"),
  });

  // Mutation gá»™p bĂ n
  const mergeTableMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.billiardTableId || !targetMergeTableId) {
        throw new Error("Vui lĂ²ng chá»n bĂ n Ä‘Ă­ch Ä‘á»ƒ gá»™p vĂ o");
      }
      return apiClient("/tables/merge", {
        method: "POST",
        body: JSON.stringify({
          sourceTableId: activeSession.billiardTableId,
          targetTableId: targetMergeTableId,
        }),
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["staff-billing-tables"] });
      setIsMergeModalOpen(false);
      setActiveSession(null);
      setTargetMergeTableId("");
      alert(res?.message || "âœ… Gá»™p bĂ n thĂ nh cĂ´ng!");
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi gá»™p bĂ n"),
  });

  // Mutation xĂ¡c nháº­n thanh toĂ¡n
  const payMutation = useMutation({
    mutationFn: async ({ invoiceId, method }: { invoiceId: string; method: string }) => {
      return apiClient(`/invoices/${invoiceId}/pay`, {
        method: "POST",
        body: JSON.stringify({
          method,
          note: "Thanh toĂ¡n thĂ nh cĂ´ng táº¡i quáº§y thu ngĂ¢n",
        }),
      });
    },
    onSuccess: (updatedInv: any) => {
      queryClient.invalidateQueries({ queryKey: ["staff-billing-tables"] });
      const pts = updatedInv?.pointsEarned || 0;
      alert(`âœ… Thanh toĂ¡n thĂ nh cĂ´ng! ${pts > 0 ? `KhĂ¡ch Ä‘Æ°á»£c cá»™ng +${pts} Ä‘iá»ƒm thÆ°á»Ÿng.` : ""}`);
      setSelectedInvoice(null);
    },
  });

  const occupiedTables = tables.filter(
    (t: any) => t.status === "OCCUPIED" && t.playSessions?.length > 0,
  );

  const openQrModal = (code: string, title: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const basePath = typeof window !== "undefined" && window.location.pathname.startsWith("/huynhchivi/doan")
      ? "/huynhchivi/doan"
      : (process.env.NEXT_PUBLIC_BASE_PATH || "");
    const url = `${origin}${basePath}/live-bill?${code}`;
    setQrCodeData({ url, title });
    setIsQrModalOpen(true);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "VIP":
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500 font-bold">Háº NG VIP</Badge>;
      case "GOLD":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500 font-bold">Háº NG GOLD</Badge>;
      case "SILVER":
        return <Badge className="bg-slate-400/20 text-slate-200 border-slate-400 font-bold">Háº NG SILVER</Badge>;
      default:
        return <Badge className="bg-zinc-800 text-zinc-300 font-bold">Háº NG STANDARD</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="STAFF" />

      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-black text-white">THU NGĂ‚N & THANH TOĂN (POS)</h1>
            <p className="text-zinc-400 text-xs mt-1">
              TĂ­nh tiá»n giá» theo block (5p, 15p, phĂºt thá»±c táº¿), chuyá»ƒn bĂ n, gá»™p bĂ n, Ă¡p dá»¥ng chiáº¿t kháº¥u háº¡ng thĂ nh viĂªn & mĂ£ voucher.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cá»™t 1: Danh sĂ¡ch bĂ n Ä‘ang chÆ¡i */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-400" />
                BĂ n Äang ChÆ¡i ({occupiedTables.length})
              </h2>

              {isLoadingTables ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
                  ))}
                </div>
              ) : occupiedTables.length === 0 ? (
                <Card className="text-center py-10 border-zinc-800 bg-zinc-900/30 text-xs text-zinc-500">
                  Hiá»‡n khĂ´ng cĂ³ bĂ n nĂ o Ä‘ang trong phiĂªn chÆ¡i.
                </Card>
              ) : (
                <div className="space-y-3">
                  {occupiedTables.map((t: any) => {
                    const session = t.playSessions[0];
                    const isSelected = activeSession?.id === session.id;
                    return (
                      <Card
                        key={t.id}
                        className={`p-4 border-zinc-800 bg-zinc-900/60 hover:border-red-500 cursor-pointer transition-all ${
                          isSelected ? "ring-2 ring-red-500 bg-red-950/20" : ""
                        }`}
                        onClick={() => {
                          setActiveSession(session);
                          setSelectedInvoice(null);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-base text-white">BĂ n {t.tableNumber}</span>
                          <Badge variant="danger">Äang chÆ¡i</Badge>
                        </div>
                        <div className="text-xs text-zinc-400">
                          {t.tableType?.name} â€¢ Báº¯t Ä‘áº§u: {formatDateTimeVN(session.startTime)}
                        </div>
                        {session.invoice?.invoiceItems?.length > 0 && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-400 font-semibold">
                            <UtensilsCrossed className="h-3 w-3" />
                            <span>{session.invoice.invoiceItems.length} dá»‹ch vá»¥/mĂ³n ({formatVND(session.invoice.serviceAmount)})</span>
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-7 gap-1 border-zinc-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              openQrModal(`table=${t.tableNumber}`, `BĂ n ${t.tableNumber}`);
                            }}
                          >
                            <QrCode className="h-3.5 w-3.5 text-red-400" />
                            MĂ£ QR BĂ n
                          </Button>
                          <Button size="sm" className="text-xs h-7">
                            TĂ­nh Tiá»n BĂ n
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cá»™t 2 & 3: Chi tiáº¿t tĂ­nh tiá»n, Há»™i viĂªn, Voucher & Thanh toĂ¡n */}
            <div className="lg:col-span-2">
              {activeSession ? (
                <Card className="border-zinc-800 bg-zinc-900/80 p-6 space-y-5">
                  {/* Top Bar with Quick Switch / Merge buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>Chá»‘t Giá» & TĂ­nh Tiá»n</span>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          PhiĂªn {activeSession.sessionCode}
                        </Badge>
                      </h3>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        BĂ n: <strong className="text-white">{activeSession.billiardTable?.tableNumber}</strong> â€¢{" "}
                        {formatVND(activeSession.hourlyRateSnapshot)}/h
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 h-8 border-indigo-700 text-indigo-300 hover:bg-indigo-950/40"
                        onClick={() => {
                          const avail = tables.find(
                            (t: any) => t.id !== activeSession.billiardTableId && t.status === "AVAILABLE"
                          );
                          if (avail) setTargetSwitchTableId(avail.id);
                          setIsSwitchModalOpen(true);
                        }}
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Chuyá»ƒn BĂ n
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 h-8 border-purple-700 text-purple-300 hover:bg-purple-950/40"
                        onClick={() => {
                          const other = tables.find(
                            (t: any) => t.id !== activeSession.billiardTableId && t.playSessions?.length > 0
                          );
                          if (other) setTargetMergeTableId(other.id);
                          setIsMergeModalOpen(true);
                        }}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Gá»™p BĂ n
                      </Button>
                    </div>
                  </div>

                  {/* 1. Chá»n cháº¿ Ä‘á»™ lĂ m trĂ²n tĂ­nh tiá»n giá» (Block rounding) */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                    <label className="block text-xs font-bold text-zinc-300">
                      Cháº¿ Ä‘á»™ lĂ m trĂ²n tiá»n giá» (Block Rounding):
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: "BLOCK_5", label: "Block 5 phĂºt (Chuáº©n)", desc: "LĂ m trĂ²n lĂªn bá»™i sá»‘ 5p" },
                        { id: "BLOCK_15", label: "Block 15 phĂºt", desc: "LĂ m trĂ²n lĂªn bá»™i sá»‘ 15p" },
                        { id: "EXACT", label: "PhĂºt thá»±c táº¿", desc: "TĂ­nh chĂ­nh xĂ¡c tá»«ng phĂºt" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRoundingMode(item.id as any)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            roundingMode === item.id
                              ? "border-red-500 bg-red-950/30 text-white"
                              : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <div className="font-bold text-xs">{item.label}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Tra cá»©u khĂ¡ch hĂ ng & Ăp dá»¥ng Æ°u Ä‘Ă£i háº¡ng thĂ nh viĂªn (Silver, Gold, VIP) */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                    <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-400" />
                        KhĂ¡ch HĂ ng ThĂ nh ViĂªn (TĂ­ch Äiá»ƒm & Chiáº¿t Kháº¥u Háº¡ng):
                      </span>
                      {customerInfo && getTierBadge(customerInfo.membershipTier)}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Nháº­p SÄT khĂ¡ch hĂ ng (VD: 0901234567)..."
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="h-9 text-xs"
                      />
                      <Button
                        size="sm"
                        className="h-9 text-xs gap-1 font-semibold"
                        onClick={handleSearchCustomer}
                        isLoading={isSearchingCustomer}
                      >
                        <Search className="h-3.5 w-3.5" />
                        Tra Cá»©u
                      </Button>
                    </div>

                    {customerSearchError && (
                      <p className="text-[11px] text-amber-400">{customerSearchError}</p>
                    )}

                    {customerInfo && (
                      <div className="p-3 rounded-lg bg-zinc-900 border border-red-900/60 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <strong className="text-white text-sm">{customerInfo.fullName}</strong>
                          <span className="text-amber-300 font-bold">{customerInfo.points || 0} PTS</span>
                        </div>
                        <div className="text-zinc-400 text-[11px] flex items-center justify-between">
                          <span>Tá»•ng chi tiĂªu: {formatVND(Number(customerInfo.totalSpending || 0))}</span>
                          <span className="text-red-400 font-semibold">
                            Tá»± Ä‘á»™ng Ă¡p dá»¥ng chiáº¿t kháº¥u háº¡ng {customerInfo.membershipTier}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Nháº­p Voucher khuyáº¿n mĂ£i */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                    <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Ticket className="h-4 w-4 text-red-400" />
                      MĂ£ Voucher Khuyáº¿n MĂ£i (Náº¿u cĂ³):
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="VD: CHAOMUNG20, ROYAL50K, FNB10..."
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="h-9 text-xs uppercase font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs font-semibold border-zinc-700"
                        onClick={handleValidateVoucher}
                        isLoading={isValidatingVoucher}
                      >
                        Ăp Dá»¥ng
                      </Button>
                    </div>

                    {voucherError && <p className="text-[11px] text-rose-400">{voucherError}</p>}

                    {appliedVoucher && (
                      <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-800 text-xs text-red-300 flex items-center justify-between">
                        <span>{appliedVoucher.message}</span>
                        <button
                          onClick={() => {
                            setAppliedVoucher(null);
                            setVoucherCode("");
                          }}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 ml-2"
                        >
                          Gá»¡ bá»
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. Gá»i thĂªm mĂ³n vĂ o bĂ n trÆ°á»›c khi chá»‘t */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                    <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <UtensilsCrossed className="h-4 w-4 text-red-400" />
                      Gá»i ThĂªm MĂ³n VĂ o BĂ n NĂ y (TrÆ°á»›c Khi Chá»‘t):
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="flex-1 h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100"
                      >
                        <option value="">-- Chá»n mĂ³n trong menu --</option>
                        {services.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({formatVND(s.unitPrice)} / {s.unit})
                          </option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        min={1}
                        value={serviceQuantity}
                        onChange={(e) => setServiceQuantity(Number(e.target.value))}
                        className="w-16 h-9 text-xs"
                      />

                      <Button
                        size="sm"
                        disabled={!selectedServiceId}
                        isLoading={addSessionOrderMutation.isPending}
                        onClick={() => addSessionOrderMutation.mutate()}
                        className="h-9 text-xs gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        ThĂªm
                      </Button>
                    </div>
                  </div>

                  {/* 5. Danh sĂ¡ch cĂ¡c mĂ³n / dá»‹ch vá»¥ Ä‘Ă£ cĂ³ trong bĂ n nĂ y */}
                  {activeSession.invoice?.invoiceItems?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                      <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-red-400">
                          <Receipt className="h-4 w-4" />
                          Dá»‹ch Vá»¥ & MĂ³n ÄĂ£ Gá»i ({activeSession.invoice.invoiceItems.length} mĂ³n):
                        </span>
                        <span className="text-red-400 font-extrabold text-xs">
                          {formatVND(Number(activeSession.invoice.serviceAmount) || 0)}
                        </span>
                      </div>
                      <div className="border border-zinc-800 rounded-lg overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                            <tr>
                              <th className="p-2">TĂªn MĂ³n / Dá»‹ch Vá»¥</th>
                              <th className="p-2 text-center">SL</th>
                              <th className="p-2 text-right">ÄÆ¡n GiĂ¡</th>
                              <th className="p-2 text-right">ThĂ nh Tiá»n</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                            {activeSession.invoice.invoiceItems.map((item: any) => (
                              <tr key={item.id} className="hover:bg-zinc-900/40">
                                <td className="p-2 font-medium text-white">{item.itemName}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">{formatVND(Number(item.unitPriceSnapshot))}</td>
                                <td className="p-2 text-right font-bold text-red-400">
                                  {formatVND(Number(item.subtotal))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NĂºt hĂ nh Ä‘á»™ng Chá»‘t giá» */}
                  <Button
                    className="w-full bg-red-600 hover:bg-red-500 font-bold h-11 text-sm shadow-lg shadow-red-950/50"
                    isLoading={createInvoiceMutation.isPending}
                    onClick={() =>
                      createInvoiceMutation.mutate({
                        sessionId: activeSession.id,
                      })
                    }
                  >
                    Chá»‘t Giá» ChÆ¡i & TĂ­nh HĂ³a ÄÆ¡n (Ăp Dá»¥ng Block & Chiáº¿t Kháº¥u)
                  </Button>
                </Card>
              ) : selectedInvoice ? (
                /* HĂ³a Ä‘Æ¡n Ä‘Ă£ chá»‘t: Chi tiáº¿t & XĂ¡c nháº­n thanh toĂ¡n */
                <Card className="border-zinc-800 bg-zinc-900/80 p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">HĂ“A ÄÆ N THANH TOĂN</h3>
                      <div className="text-xs text-red-400 font-mono font-bold mt-0.5">
                        {selectedInvoice.invoiceCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() =>
                          openQrModal(
                            `invoice=${selectedInvoice.invoiceCode}`,
                            `HĂ³a Ä‘Æ¡n ${selectedInvoice.invoiceCode}`,
                          )
                        }
                      >
                        <QrCode className="h-3.5 w-3.5 text-red-400" />
                        QR KhĂ¡ch
                      </Button>
                      <Badge variant={selectedInvoice.status === "PAID" ? "success" : "warning"}>
                        {selectedInvoice.status === "PAID" ? "ÄĂ£ Thanh ToĂ¡n" : "Chá» Thanh ToĂ¡n"}
                      </Badge>
                    </div>
                  </div>

                  {/* Chi tiáº¿t cĂ¡c dĂ²ng tĂ­nh phĂ­ */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-zinc-300">Chi tiáº¿t dá»‹ch vá»¥ & tiá»n bĂ n:</div>
                    <div className="border border-zinc-800 rounded-lg overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-2.5">Khoáº£n Má»¥c</th>
                            <th className="p-2.5 text-center">SL</th>
                            <th className="p-2.5 text-right">ÄÆ¡n GiĂ¡</th>
                            <th className="p-2.5 text-right">ThĂ nh Tiá»n</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                          {selectedInvoice.invoiceItems?.map((item: any) => (
                            <tr key={item.id}>
                              <td className="p-2.5 font-medium">{item.itemName}</td>
                              <td className="p-2.5 text-center">{item.quantity}</td>
                              <td className="p-2.5 text-right">{formatVND(item.unitPriceSnapshot)}</td>
                              <td className="p-2.5 text-right font-bold text-white">
                                {formatVND(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tá»•ng tiá»n & Chiáº¿t kháº¥u */}
                  <div className="border-t border-zinc-800 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Tiá»n giá» chÆ¡i:</span>
                      <strong className="text-white">{formatVND(Number(selectedInvoice.tableAmount))}</strong>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Tiá»n Ä‘á»“ Äƒn & dá»‹ch vá»¥ (F&B):</span>
                      <strong className="text-white">{formatVND(Number(selectedInvoice.serviceAmount))}</strong>
                    </div>

                    {Number(selectedInvoice.tierDiscount || 0) > 0 && (
                      <div className="flex justify-between text-amber-300 font-semibold">
                        <span>Chiáº¿t kháº¥u háº¡ng thĂ nh viĂªn:</span>
                        <span>-{formatVND(Number(selectedInvoice.tierDiscount))}</span>
                      </div>
                    )}

                    {Number(selectedInvoice.voucherDiscount || 0) > 0 && (
                      <div className="flex justify-between text-red-400 font-semibold">
                        <span>Chiáº¿t kháº¥u Voucher ({selectedInvoice.voucherCode}):</span>
                        <span>-{formatVND(Number(selectedInvoice.voucherDiscount))}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-3 border-t border-zinc-800">
                      <span className="text-sm font-bold text-zinc-200">Tá»”NG THANH TOĂN:</span>
                      <span className="text-2xl font-black text-red-400">
                        {formatVND(selectedInvoice.finalAmount)}
                      </span>
                    </div>

                    {selectedInvoice.status !== "PAID" && (
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <Button
                          className="gap-2 bg-red-600 hover:bg-red-500 font-semibold text-xs h-10"
                          isLoading={payMutation.isPending}
                          onClick={() =>
                            payMutation.mutate({
                              invoiceId: selectedInvoice.id,
                              method: "CASH",
                            })
                          }
                        >
                          <Banknote className="h-4 w-4" />
                          Tiá»n Máº·t
                        </Button>

                        <Button
                          className="gap-2 bg-sky-600 hover:bg-sky-500 font-semibold text-xs h-10"
                          isLoading={payMutation.isPending}
                          onClick={() =>
                            payMutation.mutate({
                              invoiceId: selectedInvoice.id,
                              method: "BANK_TRANSFER",
                            })
                          }
                        >
                          <QrCode className="h-4 w-4" />
                          Chuyá»ƒn Khoáº£n VietQR
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <Card className="text-center py-24 border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400">
                  <Receipt className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <div className="font-bold text-zinc-200">Chá»n má»™t bĂ n Ä‘ang chÆ¡i bĂªn trĂ¡i Ä‘á»ƒ láº­p hĂ³a Ä‘Æ¡n</div>
                  <div className="mt-1 text-zinc-500">
                    Há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng tĂ­nh sá»‘ phĂºt chÆ¡i theo block, Ă¡p dá»¥ng chiáº¿t kháº¥u háº¡ng tháº» & voucher.
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Switch Table Modal */}
      {isSwitchModalOpen && (
        <Modal
          isOpen={isSwitchModalOpen}
          onClose={() => setIsSwitchModalOpen(false)}
          title={`Chuyá»ƒn Vá»‹ TrĂ­ BĂ n - Nguá»“n: ${activeSession?.billiardTable?.tableNumber}`}
          description="Chuyá»ƒn thá»i gian chÆ¡i vĂ  toĂ n bá»™ dá»‹ch vá»¥ Ä‘Ă£ gá»i sang bĂ n má»›i"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Chá»n bĂ n trá»‘ng muá»‘n chuyá»ƒn sang:</label>
              <select
                value={targetSwitchTableId}
                onChange={(e) => setTargetSwitchTableId(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
              >
                <option value="">-- Chá»n bĂ n Ä‘Ă­ch kháº£ dá»¥ng --</option>
                {tables
                  .filter((t: any) => t.id !== activeSession?.billiardTableId && t.status === "AVAILABLE")
                  .map((t: any) => (
                    <option key={t.id} value={t.id}>
                      BĂ n {t.tableNumber} - {t.tableType?.name} ({t.area}) â€¢ {formatVND(t.hourlyRate || t.tableType?.hourlyRate)}/h
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">LĂ½ do Ä‘á»•i vá»‹ trĂ­ (tĂ¹y chá»n):</label>
              <Input
                value={switchReason}
                onChange={(e) => setSwitchReason(e.target.value)}
                placeholder="VD: KhĂ¡ch muá»‘n Ä‘á»•i bĂ n gáº§n Ä‘iá»u hĂ²a..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setIsSwitchModalOpen(false)}>
                Há»§y
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 font-bold"
                disabled={!targetSwitchTableId}
                isLoading={switchTableMutation.isPending}
                onClick={() => switchTableMutation.mutate()}
              >
                XĂ¡c Nháº­n Chuyá»ƒn BĂ n
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Merge Tables Modal */}
      {isMergeModalOpen && (
        <Modal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          title={`Gá»™p BĂ n - Nguá»“n: ${activeSession?.billiardTable?.tableNumber}`}
          description="TĂ­nh tiá»n giá» bĂ n nĂ y tĂ­nh Ä‘áº¿n hiá»‡n táº¡i vĂ  dá»“n hĂ³a Ä‘Æ¡n sang bĂ n Ä‘Ă­ch"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Chá»n bĂ n Ä‘Ă­ch Ä‘á»ƒ gá»™p vĂ o:</label>
              <select
                value={targetMergeTableId}
                onChange={(e) => setTargetMergeTableId(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
              >
                <option value="">-- Chá»n bĂ n Ä‘Ă­ch Ä‘ang chÆ¡i --</option>
                {tables
                  .filter((t: any) => t.id !== activeSession?.billiardTableId && t.playSessions?.length > 0)
                  .map((t: any) => (
                    <option key={t.id} value={t.id}>
                      BĂ n {t.tableNumber} - {t.tableType?.name} (Äang chÆ¡i)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setIsMergeModalOpen(false)}>
                Há»§y
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-500 font-bold"
                disabled={!targetMergeTableId}
                isLoading={mergeTableMutation.isPending}
                onClick={() => mergeTableMutation.mutate()}
              >
                XĂ¡c Nháº­n Gá»™p BĂ n
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal QR Code */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`MĂ£ QR ${qrCodeData?.title || "HĂ³a ÄÆ¡n"}`}
        description="KhĂ¡ch quĂ©t mĂ£ báº±ng camera Ä‘iá»‡n thoáº¡i Ä‘á»ƒ xem trá»±c tiáº¿p tiĂªu dĂ¹ng vĂ  chuyá»ƒn khoáº£n"
      >
        {qrCodeData && (
          <div className="space-y-4 text-center text-xs">
            <div className="p-3 bg-white rounded-xl inline-block shadow-lg mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  qrCodeData.url,
                )}`}
                alt="QR Code"
                className="w-56 h-56 object-contain mx-auto"
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 text-left space-y-1">
              <div>Link trá»±c tiáº¿p: <strong className="text-red-400 break-all">{qrCodeData.url}</strong></div>
              <div className="text-zinc-500">KhĂ¡ch khĂ´ng cáº§n tĂ i khoáº£n hay Ä‘Äƒng nháº­p váº«n xem Ä‘Æ°á»£c hĂ³a Ä‘Æ¡n.</div>
            </div>

            <div className="flex justify-center gap-3 pt-2 border-t border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(qrCodeData.url, "_blank")}
              >
                Xem Trang KhĂ¡ch
              </Button>
              <Button size="sm" onClick={() => setIsQrModalOpen(false)}>
                ÄĂ³ng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
