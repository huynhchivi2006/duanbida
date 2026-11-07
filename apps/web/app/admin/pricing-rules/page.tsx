"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatVND } from "@/lib/utils";
import { Plus, Trash2, Edit, Percent, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminPricingRulesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<"SUNDAY_ONLY" | "WEEKEND" | "HOLIDAY" | "SPECIAL_DATE">("SUNDAY_ONLY");
  const [surchargePercent, setSurchargePercent] = useState<number>(20);
  const [fixedSurcharge, setFixedSurcharge] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["admin-pricing-rules"],
    queryFn: () => apiClient("/pricing-rules"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name,
        ruleType,
        surchargePercent: Number(surchargePercent),
        fixedSurcharge: Number(fixedSurcharge),
        description,
        isActive,
      };

      if (ruleType === "SUNDAY_ONLY") {
        payload.dayOfWeek = 0;
      }

      if (ruleType === "HOLIDAY" || ruleType === "SPECIAL_DATE") {
        if (!startDate || !endDate) {
          throw new Error("Vui lĂ²ng chá»n ngĂ y báº¯t Ä‘áº§u vĂ  káº¿t thĂºc cho ngĂ y Lá»…/Táº¿t");
        }
        payload.startDate = new Date(startDate).toISOString();
        payload.endDate = new Date(`${endDate}T23:59:59.999Z`).toISOString();
      }

      if (editingRule) {
        return apiClient(`/pricing-rules/${editingRule.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        return apiClient("/pricing-rules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-rules"] });
      closeModal();
    },
    onError: (err: any) => setErrorMsg(err.message || "Lá»—i khi lÆ°u quy táº¯c"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient(`/pricing-rules/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pricing-rules"] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiClient(`/pricing-rules/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: active }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pricing-rules"] }),
  });

  const openAddModal = () => {
    setEditingRule(null);
    setName("");
    setRuleType("SUNDAY_ONLY");
    setSurchargePercent(20);
    setFixedSurcharge(0);
    setStartDate("");
    setEndDate("");
    setDescription("");
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: any) => {
    setEditingRule(rule);
    setName(rule.name);
    setRuleType(rule.ruleType);
    setSurchargePercent(Number(rule.surchargePercent));
    setFixedSurcharge(Number(rule.fixedSurcharge));
    setStartDate(rule.startDate ? rule.startDate.slice(0, 10) : "");
    setEndDate(rule.endDate ? rule.endDate.slice(0, 10) : "");
    setDescription(rule.description || "");
    setIsActive(rule.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Báº¢NG GIĂ & PHá»¤ THU NGĂ€Y Lá»„ / CHá»¦ NHáº¬T</h1>
              <p className="text-zinc-400 text-xs mt-1">
                Thiáº¿t láº­p má»©c tÄƒng giĂ¡ tá»± Ä‘á»™ng cho cĂ¡c ngĂ y cao Ä‘iá»ƒm: Chá»§ Nháº­t hĂ ng tuáº§n, Táº¿t NguyĂªn ÄĂ¡n, Lá»… 30/4 - 1/5.
              </p>
            </div>

            <Button size="sm" className="gap-2 bg-red-600 font-semibold" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              ThĂªm Quy Táº¯c Phá»¥ Thu
            </Button>
          </div>

          {/* Quick Notice Banner */}
          <Card className="border-amber-900/40 bg-amber-950/20 p-4 text-xs text-amber-200/90 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300">CÆ¡ cháº¿ tá»± Ä‘á»™ng hĂ³a:</strong> Khi khĂ¡ch hĂ ng chÆ¡i vĂ o ngĂ y Chá»§ Nháº­t hoáº·c trong ká»³ nghá»‰ Lá»…/Táº¿t Ä‘Ă£ kĂ­ch hoáº¡t, há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng nhĂ¢n tá»· lá»‡ % phá»¥ thu trĂªn tiá»n giá» chÆ¡i vĂ  hiá»ƒn thá»‹ chi tiáº¿t minh báº¡ch trĂªn hĂ³a Ä‘Æ¡n cá»§a khĂ¡ch.
            </div>
          </Card>

          {/* Rules Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <Card className="p-8 text-center border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400">
              ChÆ°a cĂ³ quy táº¯c phá»¥ thu nĂ o. Báº¥m &quot;ThĂªm Quy Táº¯c Phá»¥ Thu&quot; Ä‘á»ƒ táº¡o má»›i.
            </Card>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 whitespace-nowrap">TĂªn Quy Táº¯c</th>
                      <th className="p-3 whitespace-nowrap">Loáº¡i Ăp Dá»¥ng</th>
                      <th className="p-3 whitespace-nowrap">Má»©c Phá»¥ Thu</th>
                      <th className="p-3 whitespace-nowrap">Thá»i Gian / Chu Ká»³</th>
                      <th className="p-3 whitespace-nowrap">Tráº¡ng ThĂ¡i</th>
                      <th className="p-3 text-right whitespace-nowrap">HĂ nh Äá»™ng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {rules.map((rule: any) => (
                    <tr key={rule.id} className="hover:bg-zinc-900/40">
                      <td className="p-3 font-semibold text-white">
                        {rule.name}
                        {rule.description && (
                          <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                            {rule.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {rule.ruleType === "SUNDAY_ONLY"
                            ? "Chá»§ Nháº­t"
                            : rule.ruleType === "WEEKEND"
                            ? "Thá»© 7 & CN"
                            : rule.ruleType === "HOLIDAY"
                            ? "NgĂ y Lá»… / Táº¿t"
                            : "NgĂ y Äáº·c Biá»‡t"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-amber-400">
                          +{Number(rule.surchargePercent)}%
                        </span>
                        {Number(rule.fixedSurcharge) > 0 && (
                          <span className="text-zinc-400 text-[11px] block">
                            +{formatVND(rule.fixedSurcharge)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-zinc-400 text-[11px]">
                        {rule.ruleType === "SUNDAY_ONLY" ? (
                          "Má»—i Chá»§ Nháº­t hĂ ng tuáº§n"
                        ) : rule.ruleType === "WEEKEND" ? (
                          "Thá»© Báº£y & Chá»§ Nháº­t hĂ ng tuáº§n"
                        ) : rule.startDate && rule.endDate ? (
                          `${new Date(rule.startDate).toLocaleDateString("vi-VN")} - ${new Date(
                            rule.endDate,
                          ).toLocaleDateString("vi-VN")}`
                        ) : (
                          "KhĂ´ng giá»›i háº¡n"
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: rule.id, active: !rule.isActive })
                          }
                          className="cursor-pointer"
                        >
                          <Badge variant={rule.isActive ? "success" : "danger"}>
                            {rule.isActive ? "ÄANG Báº¬T" : "ÄĂƒ Táº®T"}
                          </Badge>
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => openEditModal(rule)}
                        >
                          <Edit className="h-3 w-3" />
                          Sá»­a
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                          onClick={() => {
                            if (confirm(`Báº¡n cháº¯c cháº¯n muá»‘n xĂ³a quy táº¯c: ${rule.name}?`)) {
                              deleteMutation.mutate(rule.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal ThĂªm / Sá»­a Quy Táº¯c */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRule ? "Sá»­a Quy Táº¯c Phá»¥ Thu" : "ThĂªm Quy Táº¯c Phá»¥ Thu Má»›i"}
        description="Äiá»u chá»‰nh giĂ¡ giá» cho ca phá»¥c vá»¥ ngĂ y lá»… Táº¿t hoáº·c ngĂ y cuá»‘i tuáº§n"
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">TĂªn Quy Táº¯c:</label>
            <Input
              placeholder="VD: Phá»¥ thu Chá»§ Nháº­t, Táº¿t NguyĂªn ÄĂ¡n..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Loáº¡i Ăp Dá»¥ng:</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="SUNDAY_ONLY">RiĂªng ngĂ y Chá»§ Nháº­t hĂ ng tuáº§n</option>
              <option value="WEEKEND">Cuá»‘i tuáº§n (Thá»© Báº£y & Chá»§ Nháº­t)</option>
              <option value="HOLIDAY">NgĂ y Lá»…, Táº¿t (theo khoáº£ng ngĂ y)</option>
              <option value="SPECIAL_DATE">Sá»± kiá»‡n Ä‘áº·c biá»‡t</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">% Phá»¥ Thu TrĂªn Tiá»n Giá»:</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={surchargePercent}
                onChange={(e) => setSurchargePercent(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Phá»¥ Thu Cá»‘ Äá»‹nh (VNÄ):</label>
              <Input
                type="number"
                min={0}
                step={5000}
                value={fixedSurcharge}
                onChange={(e) => setFixedSurcharge(Number(e.target.value))}
              />
            </div>
          </div>

          {(ruleType === "HOLIDAY" || ruleType === "SPECIAL_DATE") && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Tá»« ngĂ y:</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Äáº¿n háº¿t ngĂ y:</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">MĂ´ Táº£ / Ghi ChĂº:</label>
            <Input
              placeholder="VD: Ăp dá»¥ng phá»¥ thu 15% vĂ o ngĂ y Chá»§ Nháº­t..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-0"
            />
            <label htmlFor="isActiveCheck" className="text-zinc-200 font-medium">
              KĂ­ch hoáº¡t Ă¡p dá»¥ng quy táº¯c nĂ y ngay
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={closeModal}>
              Há»§y Bá»
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-500 font-semibold"
              isLoading={saveMutation.isPending}
              disabled={!name}
              onClick={() => saveMutation.mutate()}
            >
              {editingRule ? "LÆ°u Thay Äá»•i" : "Táº¡o Quy Táº¯c"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

