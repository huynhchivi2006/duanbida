"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import {
  Play,
  Receipt,
  Clock,
  RefreshCw,
  UtensilsCrossed,
  UserCheck,
  QrCode,
  Plus,
  Zap,
  ArrowRightLeft,
  Layers,
} from "lucide-react";

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [orderQuantity, setOrderQuantity] = useState(1);

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffRoleType, setStaffRoleType] = useState<"BALL_RACKER" | "TABLE_ATTENDANT">("BALL_RACKER");
  const [staffFee, setStaffFee] = useState<number>(30000);
  const [staffNotes, setStaffNotes] = useState("");

  const [targetSwitchTableId, setTargetSwitchTableId] = useState("");
  const [switchReason, setSwitchReason] = useState("");
  const [targetMergeTableId, setTargetMergeTableId] = useState("");

  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ["staff-tables"],
    queryFn: () => apiClient("/tables"),
    refetchInterval: 10000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-menu"],
    queryFn: () => apiClient("/services"),
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ["staff-users-list"],
    queryFn: () => apiClient("/users", { params: { role: "STAFF" } }),
  });

  // Chuyá»ƒn bĂ n khi khĂ¡ch muá»‘n Ä‘á»•i vá»‹ trĂ­
  const switchTableMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTable?.id || !targetSwitchTableId) {
        throw new Error("Vui lĂ²ng chá»n bĂ n Ä‘Ă­ch muá»‘n chuyá»ƒn Ä‘áº¿n");
      }
      return apiClient("/tables/switch", {
        method: "POST",
        body: JSON.stringify({
          sourceTableId: selectedTable.id,
          targetTableId: targetSwitchTableId,
          reason: switchReason || undefined,
        }),
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["staff-tables"] });
      setIsSwitchModalOpen(false);
      setSelectedTable(null);
      setTargetSwitchTableId("");
      setSwitchReason("");
      alert(res?.message || "âœ… Chuyá»ƒn bĂ n thĂ nh cĂ´ng!");
    },
    onError: (err: any) => alert(err.message || "KhĂ´ng thá»ƒ chuyá»ƒn bĂ n"),
  });

  // Gá»™p bĂ n khi nhĂ³m khĂ¡ch muá»‘n gá»™p thanh toĂ¡n chung
  const mergeTableMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTable?.id || !targetMergeTableId) {
        throw new Error("Vui lĂ²ng chá»n bĂ n Ä‘Ă­ch Ä‘á»ƒ gá»™p vĂ o");
      }
      return apiClient("/tables/merge", {
        method: "POST",
        body: JSON.stringify({
          sourceTableId: selectedTable.id,
          targetTableId: targetMergeTableId,
        }),
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["staff-tables"] });
      setIsMergeModalOpen(false);
      setSelectedTable(null);
      setTargetMergeTableId("");
      alert(res?.message || "âœ… Gá»™p bĂ n thĂ nh cĂ´ng!");
    },
    onError: (err: any) => alert(err.message || "KhĂ´ng thá»ƒ gá»™p bĂ n"),
  });

  // Má»Ÿ bĂ n nhanh cho khĂ¡ch vĂ£ng lai
  const quickOpenMutation = useMutation({
    mutationFn: (tableId: string) =>
      apiClient(`/invoices/quick-open/${tableId}`, {
        method: "POST",
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["staff-tables"] });
      alert(res?.message || "âœ… ÄĂ£ má»Ÿ bĂ n thĂ nh cĂ´ng! Báº¯t Ä‘áº§u tĂ­nh giá» chÆ¡i.");
    },
    onError: (err: any) => alert(err.message || "KhĂ´ng thá»ƒ má»Ÿ bĂ n"),
  });

  // Order Ä‘á»“ uá»‘ng / mĂ³n Äƒn trong lĂºc bĂ n Ä‘ang chÆ¡i
  const addSessionOrderMutation = useMutation({
    mutationFn: async () => {
      const currentTable = tables.find((t: any) => t.id === selectedTable?.id) || selectedTable;
      const activeSession = currentTable?.playSessions?.[0];

      if (!activeSession?.id) {
        throw new Error(
          `BĂ n ${currentTable?.tableNumber || ""} chÆ°a Ä‘Æ°á»£c má»Ÿ phiĂªn chÆ¡i. Vui lĂ²ng báº¥m "Má»Ÿ BĂ n Nhanh" trÆ°á»›c khi gá»i mĂ³n!`
        );
      }

      // Thá»­ gá»i endpoint session (há»— trá»£ cáº£ server Wispbyte hiá»‡n táº¡i vĂ  local)
      try {
        return await apiClient(`/invoices/session/${activeSession.id}/order`, {
          method: "POST",
          body: JSON.stringify({
            serviceId: selectedServiceId,
            quantity: Number(orderQuantity),
          }),
        });
      } catch (err: any) {
        // Fallback sang endpoint table náº¿u backend má»›i
        return await apiClient(`/invoices/table/${currentTable.id}/order`, {
          method: "POST",
          body: JSON.stringify({
            serviceId: selectedServiceId,
            quantity: Number(orderQuantity),
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-tables"] });
      setIsOrderModalOpen(false);
      setSelectedServiceId("");
      setOrderQuantity(1);
      alert("âœ… ÄĂ£ gá»i mĂ³n thĂ nh cĂ´ng vĂ o bĂ n!");
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi gá»i mĂ³n"),
  });

  // GĂ¡n nhĂ¢n viĂªn phá»¥c vá»¥ bĂ n (xáº¿p bi / Ä‘á»©ng bĂ n)
  const assignStaffMutation = useMutation({
    mutationFn: async () => {
      const currentTable = tables.find((t: any) => t.id === selectedTable?.id) || selectedTable;
      const activeSession = currentTable?.playSessions?.[0];

      if (!activeSession?.id) {
        throw new Error(
          `BĂ n ${currentTable?.tableNumber || ""} chÆ°a Ä‘Æ°á»£c má»Ÿ phiĂªn chÆ¡i. Vui lĂ²ng báº¥m "Má»Ÿ BĂ n Nhanh" trÆ°á»›c khi phĂ¢n cĂ´ng nhĂ¢n viĂªn!`
        );
      }

      try {
        return await apiClient(`/invoices/session/${activeSession.id}/assign-staff`, {
          method: "POST",
          body: JSON.stringify({
            staffId: selectedStaffId,
            roleType: staffRoleType,
            fee: Number(staffFee),
            notes: staffNotes,
          }),
        });
      } catch (err: any) {
        return await apiClient(`/invoices/table/${currentTable.id}/assign-staff`, {
          method: "POST",
          body: JSON.stringify({
            staffId: selectedStaffId,
            roleType: staffRoleType,
            fee: Number(staffFee),
            notes: staffNotes,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-tables"] });
      setIsStaffModalOpen(false);
      setSelectedStaffId("");
      setStaffNotes("");
      alert("âœ… ÄĂ£ phĂ¢n cĂ´ng nhĂ¢n viĂªn phá»¥c vá»¥ bĂ n!");
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi gĂ¡n nhĂ¢n viĂªn"),
  });

  const currentTable = tables.find((t: any) => t.id === selectedTable?.id) || selectedTable;
  const activeSession = currentTable?.playSessions?.[0];
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined ? process.env.NEXT_PUBLIC_BASE_PATH : "/huynhchivi/doan";
  const liveBillUrl = typeof window !== "undefined"
    ? `${window.location.origin}${basePath}/live-bill?table=${currentTable?.tableNumber || "B01"}`
    : `${basePath}/live-bill?table=${currentTable?.tableNumber || "B01"}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    liveBillUrl,
  )}`;

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="STAFF" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">SÆ  Äá»’ BĂ€N TRá»°C QUAN (CA LĂ€M VIá»†C)</h1>
              <p className="text-zinc-400 text-xs mt-1">
                Quáº£n lĂ½ bĂ n thá»i gian thá»±c: má»Ÿ bĂ n nhanh, gá»i thĂªm mĂ³n, gĂ¡n nhĂ¢n viĂªn xáº¿p bi vĂ  xuáº¥t mĂ£ QR.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                LĂ m Má»›i
              </Button>
              <Link href="/staff/billing">
                <Button size="sm" className="text-xs gap-1.5 bg-red-600">
                  <Receipt className="h-4 w-4" />
                  Quáº§y Thu NgĂ¢n & POS
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Status Legend */}
          <div className="flex flex-wrap items-center gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-xs">
            <span className="font-semibold text-zinc-300">ChĂº thĂ­ch tráº¡ng thĂ¡i:</span>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-zinc-300">BĂ n Trá»‘ng (Sáºµn SĂ ng)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-zinc-300">Äang ChÆ¡i (Báº¥m Ä‘á»ƒ gá»i mĂ³n/QR)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-zinc-300">CĂ³ Lá»‹ch Äáº·t TrÆ°á»›c</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="text-zinc-400">Báº£o TrĂ¬</span>
            </div>
          </div>

          {/* Grid of Tables */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-44 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tables.map((table: any) => {
                const session = table.playSessions?.[0];
                const isPlaying = Boolean(session);
                const isOccupied = isPlaying || table.status === "OCCUPIED";

                return (
                  <Card
                    key={table.id}
                    className={`border-zinc-800 transition-all cursor-pointer relative overflow-hidden ${
                      isPlaying
                        ? "bg-rose-950/20 border-rose-800/60 hover:border-rose-500 shadow-lg shadow-rose-950/30"
                        : "bg-zinc-900/70 hover:border-red-500/60"
                    }`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div
                      className={`h-1.5 w-full ${
                        isPlaying
                          ? "bg-rose-500"
                          : table.status === "MAINTENANCE"
                          ? "bg-zinc-600"
                          : "bg-red-500"
                      }`}
                    />

                    <CardContent className="p-5 flex flex-col justify-between h-40">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-black text-white">
                            {table.tableNumber}
                          </span>
                          <Badge
                            variant={
                              isPlaying
                                ? "danger"
                                : table.status === "MAINTENANCE"
                                ? "default"
                                : table.status === "OCCUPIED"
                                ? "warning"
                                : "success"
                            }
                          >
                            {isPlaying ? "ÄANG CHÆ I" : table.status === "AVAILABLE" ? "Sáº´N SĂ€NG" : table.status}
                          </Badge>
                        </div>

                        <div className="text-xs font-semibold text-zinc-300">
                          {table.tableType?.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Khu: {table.area} â€¢ {formatVND(table.hourlyRate || table.tableType?.hourlyRate)}/h
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                        {isPlaying ? (
                          <div className="text-rose-400 font-semibold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 animate-spin" />
                            <span>Äang tĂ­nh giá»</span>
                          </div>
                        ) : (
                          <span className="text-red-400 font-medium">Báº¥m Ä‘á»ƒ má»Ÿ bĂ n</span>
                        )}

                        <span className="text-[11px] text-zinc-500 underline">Thao tĂ¡c</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Table Action Modal */}
      <Modal
        isOpen={Boolean(selectedTable)}
        onClose={() => setSelectedTable(null)}
        title={`Thao TĂ¡c BĂ n ${selectedTable?.tableNumber}`}
        description={`${selectedTable?.tableType?.name} (${selectedTable?.area})`}
      >
        {selectedTable && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Tráº¡ng thĂ¡i:</span>
                <span className="font-bold text-white">{selectedTable.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">ÄÆ¡n giĂ¡ giá»:</span>
                <span className="font-bold text-red-400">
                  {formatVND(selectedTable.hourlyRate || selectedTable.tableType?.hourlyRate)} / giá»
                </span>
              </div>
              {selectedTable.playSessions?.[0] && (
                <div className="flex justify-between pt-1 border-t border-zinc-800">
                  <span className="text-zinc-400">MĂ£ phiĂªn chÆ¡i:</span>
                  <span className="font-mono font-bold text-zinc-200">
                    {selectedTable.playSessions[0].sessionCode}
                  </span>
                </div>
              )}
            </div>

            {/* Actions for playing table vs available table */}
            {selectedTable.playSessions?.[0] ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <Button
                  className="bg-red-600 hover:bg-red-500 text-xs gap-1.5 h-10"
                  onClick={() => setIsOrderModalOpen(true)}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Gá»i ThĂªm Äá»“ Uá»‘ng / MĂ³n
                </Button>

                <Button
                  className="bg-sky-600 hover:bg-sky-500 text-xs gap-1.5 h-10"
                  onClick={() => {
                    if (staffUsers.length > 0 && !selectedStaffId) {
                      setSelectedStaffId(staffUsers[0].id);
                    }
                    setIsStaffModalOpen(true);
                  }}
                >
                  <UserCheck className="h-4 w-4" />
                  NhĂ¢n ViĂªn Xáº¿p Bi / Äá»©ng BĂ n
                </Button>

                <Button
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs gap-1.5 h-10"
                  onClick={() => {
                    const availableFirst = tables.find(
                      (t: any) => t.id !== selectedTable.id && t.status === "AVAILABLE"
                    );
                    if (availableFirst) setTargetSwitchTableId(availableFirst.id);
                    setIsSwitchModalOpen(true);
                  }}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Chuyá»ƒn Vá»‹ TrĂ­ BĂ n
                </Button>

                <Button
                  className="bg-purple-600 hover:bg-purple-500 text-xs gap-1.5 h-10"
                  onClick={() => {
                    const otherOccupied = tables.find(
                      (t: any) => t.id !== selectedTable.id && t.playSessions?.length > 0
                    );
                    if (otherOccupied) setTargetMergeTableId(otherOccupied.id);
                    setIsMergeModalOpen(true);
                  }}
                >
                  <Layers className="h-4 w-4" />
                  Gá»™p BĂ n (Dá»“n HĂ³a ÄÆ¡n)
                </Button>

                <Button
                  variant="outline"
                  className="text-xs gap-1.5 h-10 border-zinc-700 hover:bg-zinc-800"
                  onClick={() => setIsQrModalOpen(true)}
                >
                  <QrCode className="h-4 w-4 text-red-400" />
                  Xuáº¥t MĂ£ QR Cho KhĂ¡ch QuĂ©t
                </Button>

                <Link href="/staff/billing" className="block">
                  <Button className="w-full bg-amber-600 hover:bg-amber-500 text-xs gap-1.5 h-10">
                    <Receipt className="h-4 w-4" />
                    Chá»‘t Tiá»n & Thanh ToĂ¡n
                  </Button>
                </Link>
              </div>
            ) : (
              /* Actions for table without active session */
              <div className="space-y-2.5 pt-1">
                {selectedTable.status === "OCCUPIED" && (
                  <p className="text-amber-400 text-[11px] font-semibold bg-amber-950/40 border border-amber-800/60 p-2 rounded-lg">
                    â ï¸ BĂ n Ä‘ang Ä‘Æ°á»£c Ä‘Ă¡nh dáº¥u báº­n nhÆ°ng chÆ°a cĂ³ giá» chÆ¡i. Báº¥m nĂºt dÆ°á»›i Ä‘á»ƒ báº¯t Ä‘áº§u tĂ­nh giá» ngay!
                  </p>
                )}

                <Button
                  className="w-full bg-red-600 hover:bg-red-500 font-bold gap-2 h-10"
                  isLoading={quickOpenMutation.isPending}
                  onClick={() => quickOpenMutation.mutate(selectedTable.id)}
                >
                  <Zap className="h-4 w-4" />
                  Má»Ÿ BĂ n Nhanh Cho KhĂ¡ch VĂ£ng Lai (Báº¯t Äáº§u Ngay)
                </Button>

                <Link href={`/book?tableId=${selectedTable.id}`} className="block">
                  <Button variant="outline" className="w-full gap-2 text-xs h-9">
                    <Play className="h-3.5 w-3.5" />
                    Táº¡o Äáº·t BĂ n Khung Giá» Cá»¥ Thá»ƒ
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal 1: Gá»i ThĂªm Äá»“ Khi BĂ n Äang ChÆ¡i */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title={`Gá»i ThĂªm Äá»“ VĂ o BĂ n ${selectedTable?.tableNumber}`}
        description="MĂ³n Äƒn / nÆ°á»›c uá»‘ng sáº½ Ä‘Æ°á»£c cá»™ng trá»±c tiáº¿p vĂ o hĂ³a Ä‘Æ¡n cá»§a lÆ°á»£t chÆ¡i nĂ y"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Chá»n mĂ³n trong menu:</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="">-- Báº¥m Ä‘á»ƒ chá»n mĂ³n --</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({formatVND(s.unitPrice)} / {s.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Sá»‘ lÆ°á»£ng:</label>
            <Input
              type="number"
              min={1}
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setIsOrderModalOpen(false)}>
              Há»§y
            </Button>
            <Button
              size="sm"
              className="bg-red-600 font-semibold gap-1.5"
              disabled={!selectedServiceId}
              isLoading={addSessionOrderMutation.isPending}
              onClick={() => addSessionOrderMutation.mutate()}
            >
              <Plus className="h-4 w-4" />
              ThĂªm VĂ o BĂ n
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: GĂ¡n NhĂ¢n ViĂªn Phá»¥c Vá»¥ BĂ n */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={`NhĂ¢n ViĂªn Phá»¥c Vá»¥ BĂ n ${selectedTable?.tableNumber}`}
        description="Ghi nháº­n nhĂ¢n viĂªn há»— trá»£ xáº¿p bi hoáº·c phá»¥c vá»¥ liĂªn tá»¥c cho khĂ¡ch"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">NhĂ¢n viĂªn phá»¥ trĂ¡ch:</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="">-- Chá»n nhĂ¢n viĂªn trong ca --</option>
              {staffUsers.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Nhiá»‡m vá»¥ phá»¥c vá»¥:</label>
            <select
              value={staffRoleType}
              onChange={(e) => {
                const val = e.target.value as any;
                setStaffRoleType(val);
                setStaffFee(val === "BALL_RACKER" ? 30000 : 50000);
              }}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="BALL_RACKER">Xáº¿p bi theo tá»«ng vĂ¡n / bĂ n</option>
              <option value="TABLE_ATTENDANT">NhĂ¢n viĂªn Ä‘á»©ng bĂ n phá»¥c vá»¥ (Marker)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">PhĂ­ dá»‹ch vá»¥ nhĂ¢n viĂªn (VNÄ):</label>
            <Input
              type="number"
              min={0}
              step={5000}
              value={staffFee}
              onChange={(e) => setStaffFee(Number(e.target.value))}
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Nháº­p 0 náº¿u Ä‘Ă¢y lĂ  dá»‹ch vá»¥ miá»…n phĂ­ cá»§a quĂ¡n.
            </span>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Ghi chĂº yĂªu cáº§u cá»§a khĂ¡ch:</label>
            <Input
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="VD: Há»— trá»£ xáº¿p bi nhanh tráº­n giao há»¯u..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setIsStaffModalOpen(false)}>
              Há»§y
            </Button>
            <Button
              size="sm"
              className="bg-sky-600 hover:bg-sky-500 font-semibold"
              disabled={!selectedStaffId}
              isLoading={assignStaffMutation.isPending}
              onClick={() => assignStaffMutation.mutate()}
            >
              XĂ¡c Nháº­n PhĂ¢n CĂ´ng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Xuáº¥t MĂ£ QR HĂ³a ÄÆ¡n Cho KhĂ¡ch QuĂ©t */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`MĂ£ QR HĂ³a ÄÆ¡n Trá»±c Tiáº¿p - BĂ n ${selectedTable?.tableNumber}`}
        description="KhĂ¡ch dĂ¹ng camera Ä‘iá»‡n thoáº¡i quĂ©t mĂ£ nĂ y Ä‘á»ƒ xem chi tiáº¿t tiĂªu dĂ¹ng thá»i gian thá»±c"
      >
        <div className="space-y-4 text-center text-xs">
          <div className="p-3 bg-white rounded-xl inline-block shadow-lg mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="MĂ£ QR BĂ n Trá»±c Tiáº¿p"
              className="w-56 h-56 object-contain mx-auto"
            />
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 text-left space-y-1">
            <div>Link hĂ³a Ä‘Æ¡n: <strong className="text-red-400 break-all">{liveBillUrl}</strong></div>
            <div className="text-zinc-500">KhĂ¡ch quĂ©t mĂ£ sáº½ tháº¥y: Thá»i gian chÆ¡i, tiá»n bĂ n, cĂ¡c mĂ³n Ä‘Ă£ gá»i vĂ  mĂ£ VietQR thanh toĂ¡n.</div>
          </div>

          <div className="flex justify-center gap-3 pt-2 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(liveBillUrl, "_blank")}
            >
              Má»Ÿ Trang Xem Thá»­
            </Button>
            <Button size="sm" onClick={() => setIsQrModalOpen(false)}>
              ÄĂ³ng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Chuyá»ƒn Vá»‹ TrĂ­ BĂ n */}
      <Modal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        title={`Chuyá»ƒn Vá»‹ TrĂ­ BĂ n - Nguá»“n: ${selectedTable?.tableNumber}`}
        description="ToĂ n bá»™ thá»i gian chÆ¡i vĂ  dá»‹ch vá»¥ Ä‘Ă£ gá»i sáº½ Ä‘Æ°á»£c chuyá»ƒn sang bĂ n má»›i"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Chá»n bĂ n trá»‘ng muá»‘n chuyá»ƒn sang:
            </label>
            <select
              value={targetSwitchTableId}
              onChange={(e) => setTargetSwitchTableId(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="">-- Chá»n bĂ n Ä‘Ă­ch kháº£ dá»¥ng --</option>
              {tables
                .filter((t: any) => t.id !== selectedTable?.id && t.status === "AVAILABLE")
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
              placeholder="VD: KhĂ¡ch Ä‘á»•i sang bĂ n gáº§n mĂ¡y láº¡nh, Ä‘á»•i loáº¡i bĂ n lá»— sang carom..."
            />
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <p>â€¢ BĂ n nguá»“n <strong className="text-white">{selectedTable?.tableNumber}</strong> sáº½ trá»Ÿ vá» tráº¡ng thĂ¡i Sáºµn SĂ ng (Trá»‘ng).</p>
            <p>â€¢ BĂ n Ä‘Ă­ch Ä‘Æ°á»£c chá»n sáº½ chuyá»ƒn sang tráº¡ng thĂ¡i Äang ChÆ¡i (Occupied).</p>
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

      {/* Modal 5: Gá»™p BĂ n (Dá»“n HĂ³a ÄÆ¡n) */}
      <Modal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        title={`Gá»™p BĂ n - BĂ n Nguá»“n: ${selectedTable?.tableNumber}`}
        description="TĂ­nh tiá»n giá» bĂ n nĂ y tĂ­nh Ä‘áº¿n hiá»‡n táº¡i vĂ  dá»“n toĂ n bá»™ tiá»n giá» + mĂ³n F&B sang bĂ n Ä‘Ă­ch"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Chá»n bĂ n Ä‘Ă­ch nháº­n gá»™p hĂ³a Ä‘Æ¡n:
            </label>
            <select
              value={targetMergeTableId}
              onChange={(e) => setTargetMergeTableId(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="">-- Chá»n bĂ n Ä‘Ă­ch Ä‘ang chÆ¡i --</option>
              {tables
                .filter((t: any) => t.id !== selectedTable?.id && t.playSessions?.length > 0)
                .map((t: any) => (
                  <option key={t.id} value={t.id}>
                    BĂ n {t.tableNumber} - {t.tableType?.name} (Äang chÆ¡i)
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/50 text-[11px] text-purple-200 space-y-1">
            <p className="font-semibold text-purple-300">Quy trĂ¬nh sau khi gá»™p bĂ n:</p>
            <p>1. Tiá»n giá» bĂ n {selectedTable?.tableNumber} Ä‘Æ°á»£c tĂ­nh theo block vĂ  chuyá»ƒn sang hĂ³a Ä‘Æ¡n bĂ n Ä‘Ă­ch.</p>
            <p>2. ToĂ n bá»™ Ä‘á»“ uá»‘ng, mĂ³n Äƒn Ä‘Ă£ gá»i á»Ÿ bĂ n nĂ y Ä‘Æ°á»£c chuyá»ƒn sang bĂ n Ä‘Ă­ch.</p>
            <p>3. BĂ n {selectedTable?.tableNumber} sáº½ káº¿t thĂºc vĂ  giáº£i phĂ³ng thĂ nh Sáºµn SĂ ng (Trá»‘ng).</p>
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
              XĂ¡c Nháº­n Gá»™p BĂ n Ngay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
