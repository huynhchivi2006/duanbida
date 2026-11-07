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
  Award,
  Gift,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Settings,
} from "lucide-react";

export default function AdminMembershipPage() {
  const queryClient = useQueryClient();

  // Tab: tiers | gifts | redemptions
  const [activeTab, setActiveTab] = useState<"tiers" | "gifts" | "redemptions">("tiers");

  // Tier modal
  const [editingTier, setEditingTier] = useState<any | null>(null);
  const [tierName, setTierName] = useState("");
  const [tierMinSpending, setTierMinSpending] = useState(0);
  const [tierDiscountTable, setTierDiscountTable] = useState(0);
  const [tierDiscountService, setTierDiscountService] = useState(0);
  const [tierPointMultiplier, setTierPointMultiplier] = useState(1);
  const [tierDescription, setTierDescription] = useState("");

  // Gift modal
  const [isAddGiftOpen, setIsAddGiftOpen] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [giftPoints, setGiftPoints] = useState(100);
  const [giftStock, setGiftStock] = useState(50);
  const [giftDesc, setGiftDesc] = useState("");

  // 1. Láº¥y danh sĂ¡ch háº¡ng thĂ nh viĂªn
  const { data: tiers = [], isLoading: isLoadingTiers } = useQuery({
    queryKey: ["admin-membership-tiers"],
    queryFn: () => apiClient("/membership/tiers"),
  });

  // 2. Láº¥y danh má»¥c quĂ  táº·ng Ä‘á»•i Ä‘iá»ƒm
  const { data: gifts = [], isLoading: isLoadingGifts } = useQuery({
    queryKey: ["admin-membership-gifts"],
    queryFn: () => apiClient("/membership/gifts"),
  });

  // 3. Láº¥y danh sĂ¡ch Ä‘á»•i quĂ 
  const { data: redemptions = [], isLoading: isLoadingRedemptions } = useQuery({
    queryKey: ["admin-membership-redemptions"],
    queryFn: () => apiClient("/membership/redemptions"),
  });

  // Mutation cáº­p nháº­t cáº¥u hĂ¬nh háº¡ng
  const updateTierMutation = useMutation({
    mutationFn: async () => {
      if (!editingTier) return;
      return apiClient(`/membership/tiers/${editingTier.tier}`, {
        method: "PUT",
        body: JSON.stringify({
          name: tierName,
          minSpending: Number(tierMinSpending),
          discountTablePercent: Number(tierDiscountTable),
          discountServicePercent: Number(tierDiscountService),
          pointMultiplier: Number(tierPointMultiplier),
          description: tierDescription,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-membership-tiers"] });
      setEditingTier(null);
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi cáº­p nháº­t cáº¥u hĂ¬nh háº¡ng"),
  });

  // Mutation thĂªm quĂ  má»›i
  const addGiftMutation = useMutation({
    mutationFn: async () => {
      return apiClient("/membership/gifts", {
        method: "POST",
        body: JSON.stringify({
          name: giftName,
          pointsRequired: Number(giftPoints),
          stockQuantity: Number(giftStock),
          description: giftDesc,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-membership-gifts"] });
      setIsAddGiftOpen(false);
      setGiftName("");
      setGiftPoints(100);
      setGiftStock(50);
      setGiftDesc("");
    },
    onError: (err: any) => alert(err.message || "Lá»—i khi thĂªm quĂ  táº·ng"),
  });

  // Mutation xĂ³a quĂ 
  const deleteGiftMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/membership/gifts/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-membership-gifts"] }),
  });

  // Mutation xĂ¡c nháº­n trao quĂ 
  const claimRedemptionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/membership/redemptions/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "CLAIMED" }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-membership-redemptions"] }),
  });

  const openEditTierModal = (tier: any) => {
    setEditingTier(tier);
    setTierName(tier.name);
    setTierMinSpending(Number(tier.minSpending));
    setTierDiscountTable(Number(tier.discountTablePercent));
    setTierDiscountService(Number(tier.discountServicePercent));
    setTierPointMultiplier(Number(tier.pointMultiplier));
    setTierDescription(tier.description || "");
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Award className="h-6 w-6 text-red-400" />
                Há»˜I VIĂN, PHĂ‚N Háº NG & TĂCH ÄIá»‚M Äá»”I QUĂ€
              </h1>
              <p className="text-zinc-400 text-xs mt-1">
                Quáº£n lĂ½ cĂ¡c háº¡ng tháº» thĂ nh viĂªn (Silver, Gold, VIP), cáº¥u hĂ¬nh quyá»n lá»£i Æ°u Ä‘Ă£i vĂ  kho quĂ  táº·ng Ä‘á»•i Ä‘iá»ƒm.
              </p>
            </div>

            {activeTab === "gifts" && (
              <Button
                size="sm"
                className="gap-2 bg-red-600 font-semibold"
                onClick={() => setIsAddGiftOpen(true)}
              >
                <Plus className="h-4 w-4" />
                ThĂªm QuĂ  Táº·ng Má»›i
              </Button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-800 gap-2">
            {[
              { id: "tiers", label: "Cáº¥u HĂ¬nh Háº¡ng Tháº» & Æ¯u ÄĂ£i", icon: Award },
              { id: "gifts", label: "Danh Má»¥c QuĂ  Äá»•i Äiá»ƒm", icon: Gift },
              { id: "redemptions", label: "YĂªu Cáº§u Äá»•i QuĂ  Cá»§a KhĂ¡ch", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                    isActive
                      ? "border-red-500 text-red-400 bg-red-950/20"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Membership Tiers Configuration */}
          {activeTab === "tiers" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map((tier: any) => (
                  <Card
                    key={tier.id}
                    className="border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge
                          className={`font-black text-xs uppercase px-2.5 py-0.5 ${
                            tier.tier === "VIP"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                              : tier.tier === "GOLD"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : tier.tier === "SILVER"
                              ? "bg-slate-400/20 text-slate-200 border-slate-400/40"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700"
                          }`}
                        >
                          {tier.tier}
                        </Badge>
                        <button
                          onClick={() => openEditTierModal(tier)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                          title="Sá»­a cáº¥u hĂ¬nh"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-white text-base mt-2">{tier.name}</h3>
                      <p className="text-zinc-400 text-xs mt-1 min-h-[32px]">
                        {tier.description || "ChÆ°a cĂ³ mĂ´ táº£"}
                      </p>

                      <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Chi tiĂªu Ä‘áº¡t má»‘c:</span>
                          <strong className="text-white">{formatVND(Number(tier.minSpending))}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Giáº£m tiá»n giá»:</span>
                          <strong className="text-red-400">-{tier.discountTablePercent}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Giáº£m tiá»n F&B:</span>
                          <strong className="text-red-400">-{tier.discountServicePercent}%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Há»‡ sá»‘ tĂ­ch Ä‘iá»ƒm:</span>
                          <strong className="text-amber-300">x{tier.pointMultiplier}</strong>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditTierModal(tier)}
                      className="mt-5 w-full text-xs font-semibold"
                    >
                      <Settings className="h-3.5 w-3.5 mr-1" />
                      Äiá»u Chá»‰nh Æ¯u ÄĂ£i
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Reward Gifts Management */}
          {activeTab === "gifts" && (
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 text-xs">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-3">TĂªn Pháº§n QuĂ </th>
                    <th className="p-3">Äiá»ƒm YĂªu Cáº§u</th>
                    <th className="p-3">Tá»“n Kho</th>
                    <th className="p-3">MĂ´ Táº£</th>
                    <th className="p-3">Tráº¡ng ThĂ¡i</th>
                    <th className="p-3 text-right">Thao TĂ¡c</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {gifts.map((gift: any) => (
                    <tr key={gift.id} className="hover:bg-zinc-800/30">
                      <td className="p-3 font-bold text-white">{gift.name}</td>
                      <td className="p-3 font-bold text-amber-300">{gift.pointsRequired} PTS</td>
                      <td className="p-3">{gift.stockQuantity}</td>
                      <td className="p-3 text-zinc-400 max-w-xs truncate">{gift.description}</td>
                      <td className="p-3">
                        <Badge variant={gift.isActive ? "success" : "default"}>
                          {gift.isActive ? "Äang Ă¡p dá»¥ng" : "Táº¡m dá»«ng"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Báº¡n cĂ³ cháº¯c muá»‘n xĂ³a quĂ  "${gift.name}"?`)) {
                              deleteGiftMutation.mutate(gift.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-7 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Redemptions Management */}
          {activeTab === "redemptions" && (
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 text-xs">
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-3">KhĂ¡ch HĂ ng</th>
                    <th className="p-3">Sá»‘ Äiá»‡n Thoáº¡i</th>
                    <th className="p-3">Pháº§n QuĂ </th>
                    <th className="p-3">Äiá»ƒm ÄĂ£ Trá»«</th>
                    <th className="p-3">Thá»i Gian YĂªu Cáº§u</th>
                    <th className="p-3">Tráº¡ng ThĂ¡i</th>
                    <th className="p-3 text-right">HĂ nh Äá»™ng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {redemptions.map((red: any) => (
                    <tr key={red.id} className="hover:bg-zinc-800/30">
                      <td className="p-3 font-bold text-white">{red.user?.fullName}</td>
                      <td className="p-3 text-zinc-300 font-mono">{red.user?.phone || red.user?.email}</td>
                      <td className="p-3 font-semibold text-amber-200">{red.gift?.name}</td>
                      <td className="p-3 text-amber-400 font-bold">-{red.pointsSpent} PTS</td>
                      <td className="p-3 text-zinc-400">{formatDateTimeVN(red.createdAt)}</td>
                      <td className="p-3">
                        {red.status === "CLAIMED" ? (
                          <Badge variant="success">ÄĂ£ Trao QuĂ </Badge>
                        ) : (
                          <Badge variant="warning">Chá» Trao QuĂ </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {red.status !== "CLAIMED" && (
                          <Button
                            size="sm"
                            onClick={() => claimRedemptionMutation.mutate(red.id)}
                            className="bg-red-600 hover:bg-red-500 font-bold text-xs h-7"
                          >
                            XĂ¡c Nháº­n Trao QuĂ 
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit Tier Modal */}
          {editingTier && (
            <Modal
              isOpen={!!editingTier}
              onClose={() => setEditingTier(null)}
              title={`Cáº¥u HĂ¬nh Æ¯u ÄĂ£i Háº¡ng ${editingTier.tier}`}
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">TĂªn hiá»ƒn thá»‹:</label>
                  <Input value={tierName} onChange={(e) => setTierName(e.target.value)} />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Má»©c chi tiĂªu tá»‘i thiá»ƒu Ä‘á»ƒ thÄƒng háº¡ng (VNÄ):
                  </label>
                  <Input
                    type="number"
                    value={tierMinSpending}
                    onChange={(e) => setTierMinSpending(Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Chiáº¿t kháº¥u tiá»n giá» (%):</label>
                    <Input
                      type="number"
                      value={tierDiscountTable}
                      onChange={(e) => setTierDiscountTable(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Chiáº¿t kháº¥u Ä‘á»“ F&B (%):</label>
                    <Input
                      type="number"
                      value={tierDiscountService}
                      onChange={(e) => setTierDiscountService(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Há»‡ sá»‘ nhĂ¢n tĂ­ch Ä‘iá»ƒm (1.0 = chuáº©n, 1.5 = gáº¥p rÆ°á»¡i, 2.0 = gáº¥p Ä‘Ă´i):
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tierPointMultiplier}
                    onChange={(e) => setTierPointMultiplier(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">MĂ´ táº£ quyá»n lá»£i:</label>
                  <Input value={tierDescription} onChange={(e) => setTierDescription(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingTier(null)}>
                    Há»§y
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 font-bold"
                    isLoading={updateTierMutation.isPending}
                    onClick={() => updateTierMutation.mutate()}
                  >
                    LÆ°u Thay Äá»•i
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Add Gift Modal */}
          {isAddGiftOpen && (
            <Modal
              isOpen={isAddGiftOpen}
              onClose={() => setIsAddGiftOpen(false)}
              title="ThĂªm QuĂ  Táº·ng Äá»•i Äiá»ƒm Má»›i"
            >
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">TĂªn pháº§n quĂ :</label>
                  <Input
                    placeholder="VD: 01 Giá» chÆ¡i bida miá»…n phĂ­"
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Sá»‘ Ä‘iá»ƒm cáº§n Ä‘á»•i (PTS):</label>
                    <Input
                      type="number"
                      value={giftPoints}
                      onChange={(e) => setGiftPoints(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Sá»‘ lÆ°á»£ng tá»“n kho:</label>
                    <Input
                      type="number"
                      value={giftStock}
                      onChange={(e) => setGiftStock(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">MĂ´ táº£ quĂ  táº·ng:</label>
                  <Input
                    placeholder="MĂ´ táº£ chi tiáº¿t quyá»n lá»£i..."
                    value={giftDesc}
                    onChange={(e) => setGiftDesc(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAddGiftOpen(false)}>
                    Há»§y
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 font-bold"
                    isLoading={addGiftMutation.isPending}
                    onClick={() => addGiftMutation.mutate()}
                  >
                    Táº¡o QuĂ  Táº·ng
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </main>
    </div>
  );
}

