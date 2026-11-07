"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatVND } from "@/lib/utils";
import { Plus, Trash2, Edit, TableProperties, DollarSign, Clock, Crown, Sparkles } from "lucide-react";

export default function AdminTablesPage() {
  const queryClient = useQueryClient();
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [editingTable, setEditingTable] = useState<any | null>(null);

  // Form thĂªm bĂ n
  const [tableNumber, setTableNumber] = useState("");
  const [tableTypeId, setTableTypeId] = useState("");
  const [area, setArea] = useState<"STANDARD" | "VIP" | "OUTDOOR">("STANDARD");
  const [customHourlyRate, setCustomHourlyRate] = useState<string>("");
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form sá»­a tá»«ng bĂ n
  const [editTableNumber, setEditTableNumber] = useState("");
  const [editTableTypeId, setEditTableTypeId] = useState("");
  const [editArea, setEditArea] = useState<"STANDARD" | "VIP" | "OUTDOOR">("STANDARD");
  const [editCustomHourlyRate, setEditCustomHourlyRate] = useState<string>("");
  const [editNote, setEditNote] = useState("");

  // Form sá»­a giĂ¡ loáº¡i bĂ n
  const [typeName, setTypeName] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number>(80000);
  const [typeDescription, setTypeDescription] = useState("");

  const { data: tables = [], isLoading: isLoadingTables } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: () => apiClient("/tables"),
  });

  const { data: tableTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["table-types"],
    queryFn: () => apiClient("/table-types"),
  });

  // ThĂªm bĂ n má»›i
  const addTableMutation = useMutation({
    mutationFn: async () => {
      return apiClient("/tables", {
        method: "POST",
        body: JSON.stringify({
          tableNumber,
          tableTypeId,
          area,
          hourlyRate: customHourlyRate ? Number(customHourlyRate) : null,
          note,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] });
      setIsAddTableModalOpen(false);
      setTableNumber("");
      setCustomHourlyRate("");
      setNote("");
      setErrorMsg(null);
    },
    onError: (err: any) => setErrorMsg(err.message || "KhĂ´ng thá»ƒ táº¡o bĂ n má»›i"),
  });

  // Sá»­a thĂ´ng tin & Ä‘Æ¡n giĂ¡ riĂªng cá»§a tá»«ng bĂ n
  const updateTableMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        tableNumber: editTableNumber,
        tableTypeId: editTableTypeId,
        area: editArea,
        note: editNote,
      };

      if (editCustomHourlyRate) {
        payload.hourlyRate = Number(editCustomHourlyRate);
      }

      try {
        return await apiClient(`/tables/${editingTable.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        // Tá»± Ä‘á»™ng tÆ°Æ¡ng thĂ­ch náº¿u server backend chÆ°a ká»‹p restart nháº­n trÆ°á»ng hourlyRate
        if (err?.message?.includes("hourlyRate") && payload.hourlyRate) {
          try {
            await apiClient(`/table-types/${editTableTypeId}`, {
              method: "PUT",
              body: JSON.stringify({
                hourlyRate: Number(editCustomHourlyRate),
              }),
            });
          } catch (typeErr) {
            console.warn("Could not update table-type price fallback", typeErr);
          }

          delete payload.hourlyRate;
          return await apiClient(`/tables/${editingTable.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] });
      queryClient.invalidateQueries({ queryKey: ["table-types"] });
      setEditingTable(null);
      setErrorMsg(null);
      alert("âœ… ÄĂ£ cáº­p nháº­t Ä‘Æ¡n giĂ¡ vĂ  thĂ´ng tin bĂ n thĂ nh cĂ´ng!");
    },
    onError: (err: any) => setErrorMsg(err.message || "Lá»—i khi cáº­p nháº­t bĂ n"),
  });

  // Cáº­p nháº­t giĂ¡ giá» cá»§a loáº¡i bĂ n
  const updateTypeMutation = useMutation({
    mutationFn: async () => {
      return apiClient(`/table-types/${editingType.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: typeName,
          hourlyRate: Number(hourlyRate),
          description: typeDescription,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-types"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tables"] });
      setEditingType(null);
      setErrorMsg(null);
    },
    onError: (err: any) => setErrorMsg(err.message || "Lá»—i khi cáº­p nháº­t giĂ¡ loáº¡i bĂ n"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiClient(`/tables/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tables"] }),
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => apiClient(`/tables/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tables"] }),
    onError: (err: any) => alert(err.message || "Lá»—i khi xĂ³a bĂ n"),
  });

  const openEditTypeModal = (type: any) => {
    setEditingType(type);
    setTypeName(type.name);
    setHourlyRate(Number(type.hourlyRate));
    setTypeDescription(type.description || "");
    setErrorMsg(null);
  };

  const openEditTableModal = (table: any) => {
    setEditingTable(table);
    setEditTableNumber(table.tableNumber);
    setEditTableTypeId(table.tableTypeId);
    setEditArea(table.area || "STANDARD");
    setEditCustomHourlyRate(table.hourlyRate != null ? String(Number(table.hourlyRate)) : "");
    setEditNote(table.note || "");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">QUáº¢N LĂ BĂ€N & ÄÆ N GIĂ GIá»œ</h1>
              <p className="text-zinc-400 text-xs mt-1">
                Äiá»u chá»‰nh giĂ¡ giá» riĂªng cho tá»«ng bĂ n (BĂ n VIP, BĂ n chuáº©n), sá»­a giĂ¡ theo loáº¡i bĂ n vĂ  quáº£n lĂ½ tráº¡ng thĂ¡i.
              </p>
            </div>

            <Button
              className="gap-2 bg-red-600 font-semibold"
              onClick={() => {
                if (tableTypes.length > 0 && !tableTypeId) {
                  setTableTypeId(tableTypes[0].id);
                }
                setIsAddTableModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              ThĂªm BĂ n Bi-Da
            </Button>
          </div>

          {/* Section 1: ÄÆ¡n GiĂ¡ Theo Loáº¡i BĂ n (Base Pricing) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-400" />
                Báº£ng GiĂ¡ Máº·c Äá»‹nh Theo Loáº¡i BĂ n
              </h2>
              <span className="text-xs text-zinc-500">Báº¥m &quot;Sá»­a GiĂ¡&quot; Ä‘á»ƒ Ä‘á»•i giĂ¡ chung cá»§a dĂ²ng bĂ n</span>
            </div>

            {isLoadingTypes ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {tableTypes.map((type: any) => (
                  <Card key={type.id} className="p-4 border-zinc-800 bg-zinc-900/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-xs">{type.name}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {type.code}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xl font-black text-red-400">
                        {formatVND(type.hourlyRate)}
                        <span className="text-xs font-normal text-zinc-500"> / giá»</span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2">
                        {type.description || "ChÆ°a cĂ³ mĂ´ táº£"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-zinc-700"
                        onClick={() => openEditTypeModal(type)}
                      >
                        <Edit className="h-3 w-3" />
                        Sá»­a GiĂ¡ Loáº¡i BĂ n
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Danh SĂ¡ch Tá»«ng BĂ n & GiĂ¡ RiĂªng */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <TableProperties className="h-4 w-4 text-red-400" />
                Danh SĂ¡ch BĂ n Váº­t LĂ½ &amp; GiĂ¡ ThuĂª Tá»«ng BĂ n ({tables.length} bĂ n)
              </h2>
              <span className="text-xs text-zinc-400">BĂ n VIP cĂ³ thá»ƒ Ä‘áº·t giĂ¡ riĂªng cao hÆ¡n bĂ n thÆ°á»ng</span>
            </div>

            {isLoadingTables ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">MĂ£ BĂ n</th>
                      <th className="p-3.5">Loáº¡i BĂ n</th>
                      <th className="p-3.5">Khu Vá»±c</th>
                      <th className="p-3.5">ÄÆ¡n GiĂ¡ / Giá»</th>
                      <th className="p-3.5">Tráº¡ng ThĂ¡i</th>
                      <th className="p-3.5 text-right">HĂ nh Äá»™ng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {tables.map((t: any) => {
                      const effectiveRate = t.hourlyRate != null ? Number(t.hourlyRate) : Number(t.tableType?.hourlyRate || 80000);
                      const isCustom = t.hourlyRate != null;
                      const isVip = t.area === "VIP";

                      return (
                        <tr key={t.id} className="hover:bg-zinc-900/50">
                          <td className="p-3.5 font-black text-white text-sm">
                            <div className="flex items-center gap-1.5">
                              {isVip && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                              <span>{t.tableNumber}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-semibold text-zinc-200">
                            {t.tableType?.name}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                isVip
                                  ? "bg-amber-950/80 text-amber-300 border border-amber-800/60"
                                  : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {t.area}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-400 text-sm">
                                {formatVND(effectiveRate)}/h
                              </span>
                              {isCustom ? (
                                <Badge className="bg-amber-600 text-white text-[10px] font-semibold py-0 px-1.5">
                                  GiĂ¡ riĂªng
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-medium">
                                  (GiĂ¡ loáº¡i bĂ n)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={t.status}
                              disabled={updateStatusMutation.isPending}
                              onChange={(e) =>
                                updateStatusMutation.mutate({
                                  id: t.id,
                                  status: e.target.value,
                                })
                              }
                              className="bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-md px-2 py-1 text-xs focus:ring-red-500"
                            >
                              <option value="AVAILABLE">AVAILABLE (Trá»‘ng)</option>
                              <option value="OCCUPIED">OCCUPIED (Äang chÆ¡i)</option>
                              <option value="RESERVED">RESERVED (ÄĂ£ Ä‘áº·t)</option>
                              <option value="MAINTENANCE">MAINTENANCE (Báº£o trĂ¬)</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2.5 gap-1 border-zinc-700 hover:bg-zinc-800 text-red-400 font-semibold"
                              onClick={() => openEditTableModal(t)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Sá»­a GiĂ¡ BĂ n
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => {
                                if (confirm(`Báº¡n cháº¯c cháº¯n muá»‘n xĂ³a bĂ n ${t.tableNumber}?`)) {
                                  deleteTableMutation.mutate(t.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal 1: Sá»­a GiĂ¡ Giá» RiĂªng Tá»«ng BĂ n (BĂ n VIP / BĂ n ThÆ°á»ng) */}
      <Modal
        isOpen={Boolean(editingTable)}
        onClose={() => setEditingTable(null)}
        title={`Sá»­a GiĂ¡ & ThĂ´ng Tin BĂ n ${editingTable?.tableNumber}`}
        description="Báº¡n cĂ³ thá»ƒ Ä‘áº·t giĂ¡ thuĂª riĂªng cho bĂ n nĂ y (VD: BĂ n VIP) hoáº·c Ä‘á»ƒ trá»‘ng Ä‘á»ƒ dĂ¹ng giĂ¡ máº·c Ä‘á»‹nh cá»§a loáº¡i bĂ n."
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">MĂ£ sá»‘ bĂ n:</label>
            <Input
              value={editTableNumber}
              onChange={(e) => setEditTableNumber(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Loáº¡i bĂ n:</label>
            <select
              value={editTableTypeId}
              onChange={(e) => setEditTableTypeId(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              {tableTypes.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} (GiĂ¡ gá»‘c loáº¡i bĂ n: {formatVND(t.hourlyRate)}/h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Khu vá»±c phĂ¢n bá»‘:</label>
            <select
              value={editArea}
              onChange={(e) => setEditArea(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="STANDARD">Khu TiĂªu Chuáº©n (STANDARD)</option>
              <option value="VIP">PhĂ²ng VIP (VIP)</option>
              <option value="OUTDOOR">Khu NgoĂ i Trá»i (OUTDOOR)</option>
            </select>
          </div>

          {/* ÄÆ¡n giĂ¡ riĂªng cá»§a bĂ n */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-red-900/60 space-y-1.5">
            <label className="block text-red-400 font-bold">
              ÄÆ¡n GiĂ¡ ThuĂª RiĂªng Cá»§a BĂ n NĂ y (VNÄ / giá»):
            </label>
            <Input
              type="number"
              min={0}
              step={5000}
              value={editCustomHourlyRate}
              onChange={(e) => setEditCustomHourlyRate(e.target.value)}
              placeholder="Äá»ƒ trá»‘ng náº¿u dĂ¹ng giĂ¡ máº·c Ä‘á»‹nh loáº¡i bĂ n"
              className="text-red-400 font-bold text-base"
            />
            <p className="text-[11px] text-zinc-400">
              đŸ’¡ <em>VĂ­ dá»¥ bĂ n VIP báº¡n cĂ³ thá»ƒ Ä‘áº·t <strong>120.000 Ä‘/h</strong> hoáº·c <strong>150.000 Ä‘/h</strong>. Náº¿u Ä‘á»ƒ trá»‘ng, há»‡ thá»‘ng tá»± Ä‘á»™ng tĂ­nh theo giĂ¡ loáº¡i bĂ n.</em>
            </p>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Ghi chĂº Ä‘áº·c Ä‘iá»ƒm:</label>
            <Input
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="VD: PhĂ²ng VIP sĂ´ pha riĂªng, view thoĂ¡ng..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setEditingTable(null)}>
              Há»§y
            </Button>
            <Button
              size="sm"
              className="bg-red-600 font-semibold"
              isLoading={updateTableMutation.isPending}
              disabled={!editTableNumber}
              onClick={() => updateTableMutation.mutate()}
            >
              LÆ°u ÄÆ¡n GiĂ¡ BĂ n
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Sá»­a GiĂ¡ Máº·c Äá»‹nh Loáº¡i BĂ n */}
      <Modal
        isOpen={Boolean(editingType)}
        onClose={() => setEditingType(null)}
        title={`Sá»­a GiĂ¡ Giá» Loáº¡i BĂ n: ${editingType?.name}`}
        description={`MĂ£ loáº¡i bĂ n: ${editingType?.code}`}
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">TĂªn loáº¡i bĂ n:</label>
            <Input
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">ÄÆ¡n giĂ¡ giá» má»›i (VNÄ/giá»):</label>
            <Input
              type="number"
              min={10000}
              step={5000}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="text-red-400 font-bold text-base"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">MĂ´ táº£ Ä‘áº·c Ä‘iá»ƒm:</label>
            <Input
              value={typeDescription}
              onChange={(e) => setTypeDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setEditingType(null)}>
              Há»§y
            </Button>
            <Button
              size="sm"
              className="bg-red-600 font-semibold"
              isLoading={updateTypeMutation.isPending}
              disabled={!typeName}
              onClick={() => updateTypeMutation.mutate()}
            >
              Cáº­p Nháº­t GiĂ¡ BĂ n
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: ThĂªm BĂ n Má»›i */}
      <Modal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        title="ThĂªm BĂ n Bi-Da Má»›i"
        description="Táº¡o bĂ n má»›i vĂ  cĂ³ thá»ƒ Ä‘áº·t giĂ¡ riĂªng cho bĂ n VIP hoáº·c bĂ n Ä‘áº·c biá»‡t"
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Sá»‘ / MĂ£ bĂ n (VD: B11, VIP03):</label>
            <Input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value.toUpperCase())}
              placeholder="VD: B11"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Loáº¡i bĂ n bi-da:</label>
            <select
              value={tableTypeId}
              onChange={(e) => setTableTypeId(e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              {tableTypes.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} (GiĂ¡ gá»‘c loáº¡i bĂ n: {formatVND(t.hourlyRate)}/h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Khu vá»±c phĂ¢n bá»‘:</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as any)}
              className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-zinc-100"
            >
              <option value="STANDARD">Khu TiĂªu Chuáº©n (STANDARD)</option>
              <option value="VIP">PhĂ²ng VIP (VIP)</option>
              <option value="OUTDOOR">Khu NgoĂ i Trá»i (OUTDOOR)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              ÄÆ¡n giĂ¡ giá» riĂªng cá»§a bĂ n nĂ y (VNÄ/giá» - TĂ¹y chá»n):
            </label>
            <Input
              type="number"
              min={0}
              step={5000}
              value={customHourlyRate}
              onChange={(e) => setCustomHourlyRate(e.target.value)}
              placeholder="VD: 120000 (Ä‘á»ƒ trá»‘ng náº¿u dĂ¹ng giĂ¡ máº·c Ä‘á»‹nh)"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Ghi chĂº thĂªm:</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: PhĂ²ng VIP riĂªng tÆ°, sofa cao cáº¥p..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddTableModalOpen(false)}>
              Há»§y
            </Button>
            <Button
              size="sm"
              className="bg-red-600 font-semibold"
              isLoading={addTableMutation.isPending}
              disabled={!tableNumber || !tableTypeId}
              onClick={() => addTableMutation.mutate()}
            >
              Táº¡o BĂ n Má»›i
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
