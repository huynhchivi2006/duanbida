"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function CustomerProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : ""
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileMsg(null);

    try {
      await apiClient("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ fullName, phone, dateOfBirth: dateOfBirth || null }),
      });
      await refreshProfile();
      setProfileMsg("Cáº­p nháº­t thĂ´ng tin cĂ¡ nhĂ¢n thĂ nh cĂ´ng!");
    } catch (err: any) {
      setProfileMsg(err.message || "Lá»—i khi cáº­p nháº­t");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPass(true);
    setPassMsg(null);

    try {
      await apiClient("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setPassMsg({ type: "success", text: "Äá»•i máº­t kháº©u thĂ nh cĂ´ng!" });
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPassMsg({ type: "error", text: err.message || "KhĂ´ng thá»ƒ Ä‘á»•i máº­t kháº©u" });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="CUSTOMER" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-black text-white">Há»’ SÆ  CĂ NHĂ‚N</h1>
            <p className="text-zinc-400 text-xs mt-1">
              Quáº£n lĂ½ thĂ´ng tin liĂªn há»‡ vĂ  báº£o máº­t tĂ i khoáº£n cá»§a báº¡n.
            </p>
          </div>

          {/* Profile Form */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base text-zinc-200">ThĂ´ng Tin TĂ i Khoáº£n</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {profileMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Email (Äá»‹nh danh):</label>
                  <Input value={user?.email || ""} disabled className="bg-zinc-950/40 opacity-70" />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Há» vĂ  tĂªn:</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Sá»‘ Ä‘iá»‡n thoáº¡i:</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">NgĂ y sinh (DĂ nh cho Æ°u Ä‘Ă£i sinh nháº­t):</label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <Button type="submit" size="sm" isLoading={isUpdating}>
                  LÆ°u Thay Äá»•i
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base text-zinc-200">Äá»•i Máº­t Kháº©u</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {passMsg && (
                <div
                  className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                    passMsg.type === "success"
                      ? "bg-red-950/40 border border-red-800 text-red-300"
                      : "bg-rose-950/40 border border-rose-800 text-rose-300"
                  }`}
                >
                  {passMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {passMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Máº­t kháº©u hiá»‡n táº¡i:</label>
                  <Input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Máº­t kháº©u má»›i (tá»‘i thiá»ƒu 6 kĂ½ tá»±):</label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" size="sm" variant="secondary" isLoading={isChangingPass}>
                  Äá»•i Máº­t Kháº©u
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

