"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import { Plus, UserCheck, Shield, Users, Search, Award, Crown } from "lucide-react";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Staff@123456");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [role, setRole] = useState<"STAFF" | "CUSTOMER">("STAFF");
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", search, selectedTier, selectedRole],
    queryFn: () =>
      apiClient("/users", {
        params: {
          search: search || undefined,
          tier: selectedTier || undefined,
          role: selectedRole || undefined,
        },
      }),
  });

  const addUserMutation = useMutation({
    mutationFn: async () => {
      return apiClient("/users", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName, phone, role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsAddModalOpen(false);
      setEmail("");
      setFullName("");
      setPhone("");
      setErrorMsg(null);
    },
    onError: (err: any) => setErrorMsg(err.message || "KhĂ´ng thá»ƒ táº¡o tĂ i khoáº£n"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiClient(`/users/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "VIP":
        return <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-black">VIP</Badge>;
      case "GOLD":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-black">GOLD</Badge>;
      case "SILVER":
        return <Badge className="bg-slate-400/20 text-slate-200 border-slate-400/40 font-black">SILVER</Badge>;
      default:
        return <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">STANDARD</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                KHĂCH HĂ€NG & PHĂ‚N QUYá»€N (RBAC)
              </h1>
              <p className="text-zinc-400 text-xs mt-1">
                Theo dĂµi dá»¯ liá»‡u khĂ¡ch hĂ ng (SÄT, ngĂ y sinh, tá»•ng chi tiĂªu, táº§n suáº¥t chÆ¡i, phĂ¢n háº¡ng thĂ nh viĂªn Silver, Gold, VIP).
              </p>
            </div>

            <Button
              size="sm"
              className="gap-2 bg-red-600 font-semibold"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Táº¡o TĂ i Khoáº£n Má»›i
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <div className="relative">
              <Search className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5" />
              <Input
                placeholder="TĂ¬m theo há» tĂªn, SÄT, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 px-3 text-zinc-200 text-xs"
              >
                <option value="">Táº¥t cáº£ háº¡ng thĂ nh viĂªn</option>
                <option value="STANDARD">Háº¡ng ThÆ°á»ng (Standard)</option>
                <option value="SILVER">Háº¡ng Báº¡c (Silver)</option>
                <option value="GOLD">Háº¡ng VĂ ng (Gold)</option>
                <option value="VIP">Háº¡ng VIP Kim CÆ°Æ¡ng</option>
              </select>
            </div>

            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 px-3 text-zinc-200 text-xs"
              >
                <option value="">Táº¥t cáº£ vai trĂ²</option>
                <option value="CUSTOMER">KhĂ¡ch HĂ ng</option>
                <option value="STAFF">NhĂ¢n ViĂªn</option>
                <option value="ADMIN">Quáº£n Trá»‹ ViĂªn</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 border border-zinc-800 rounded-xl bg-zinc-900/40 text-xs text-zinc-500">
              KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng phĂ¹ há»£p vá»›i Ä‘iá»u kiá»‡n tĂ¬m kiáº¿m.
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[850px]">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 whitespace-nowrap">Há» vĂ  TĂªn</th>
                      <th className="p-3 whitespace-nowrap">Sá»‘ Äiá»‡n Thoáº¡i</th>
                      <th className="p-3 whitespace-nowrap">NgĂ y Sinh</th>
                      <th className="p-3 whitespace-nowrap">Háº¡ng Tháº»</th>
                      <th className="p-3 whitespace-nowrap">Äiá»ƒm TĂ­ch LÅ©y</th>
                      <th className="p-3 whitespace-nowrap">Tá»•ng Chi TiĂªu</th>
                      <th className="p-3 whitespace-nowrap">Táº§n Suáº¥t ChÆ¡i</th>
                      <th className="p-3 whitespace-nowrap">Vai TrĂ²</th>
                      <th className="p-3 whitespace-nowrap">Tráº¡ng ThĂ¡i</th>
                      <th className="p-3 text-right whitespace-nowrap">KhĂ³a / Má»Ÿ</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-zinc-900/50">
                      <td className="p-3 font-semibold text-white">
                        <div>{u.fullName}</div>
                        <div className="text-[10px] text-zinc-500">{u.email}</div>
                      </td>
                      <td className="p-3 font-mono text-zinc-300">{u.phone || "-"}</td>
                      <td className="p-3 text-zinc-400">
                        {u.dateOfBirth
                          ? new Date(u.dateOfBirth).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="p-3">
                        {u.role === "CUSTOMER" ? getTierBadge(u.membershipTier) : <span className="text-zinc-600">-</span>}
                      </td>
                      <td className="p-3 font-bold text-amber-300">
                        {u.role === "CUSTOMER" ? `${(u.points || 0).toLocaleString("vi-VN")} PTS` : "-"}
                      </td>
                      <td className="p-3 font-bold text-red-400">
                        {u.role === "CUSTOMER" ? formatVND(Number(u.totalSpending || 0)) : "-"}
                      </td>
                      <td className="p-3 text-zinc-300">
                        {u.role === "CUSTOMER" ? `${u.visitCount || 0} láº§n` : "-"}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            u.role === "ADMIN"
                              ? "danger"
                              : u.role === "STAFF"
                              ? "info"
                              : "default"
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-semibold ${
                            u.status === "ACTIVE"
                              ? "text-red-400"
                              : "text-rose-400"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.role !== "ADMIN" && (
                          <Button
                            variant={u.status === "ACTIVE" ? "danger" : "secondary"}
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: u.id,
                                status: u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                              })
                            }
                          >
                            {u.status === "ACTIVE" ? "KhĂ³a" : "Má»Ÿ KhĂ³a"}
                          </Button>
                        )}
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

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Táº¡o TĂ i Khoáº£n Má»›i"
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Vai trĂ² ngÆ°á»i dĂ¹ng:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 px-3 text-zinc-200 text-xs"
            >
              <option value="STAFF">NhĂ¢n ViĂªn Thu NgĂ¢n (STAFF)</option>
              <option value="CUSTOMER">KhĂ¡ch HĂ ng (CUSTOMER)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Há» vĂ  tĂªn:</label>
            <Input
              placeholder="VD: Tráº§n VÄƒn Nam"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Email (Äá»‹nh danh Ä‘Äƒng nháº­p):</label>
            <Input
              type="email"
              placeholder="VD: nam.tv@billiards.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Sá»‘ Ä‘iá»‡n thoáº¡i:</label>
            <Input
              placeholder="VD: 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Máº­t kháº©u khá»Ÿi táº¡o:</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Há»§y
            </Button>
            <Button
              size="sm"
              className="bg-red-600 font-semibold"
              isLoading={addUserMutation.isPending}
              onClick={() => addUserMutation.mutate()}
            >
              Táº¡o NgÆ°á»i DĂ¹ng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
