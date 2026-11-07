"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import { CalendarDays, Clock, Search } from "lucide-react";

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-all-bookings", searchTerm, statusFilter],
    queryFn: () =>
      apiClient("/bookings", {
        params: {
          search: searchTerm || undefined,
          status: statusFilter || undefined,
        },
      }),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Chá» Duyá»‡t</Badge>;
      case "CONFIRMED":
        return <Badge variant="success">ÄĂ£ Giá»¯ Chá»—</Badge>;
      case "CHECKED_IN":
        return <Badge variant="info">ÄĂ£ Check-in</Badge>;
      case "IN_USE":
        return <Badge variant="danger">Äang ChÆ¡i</Badge>;
      case "COMPLETED":
        return <Badge variant="default">HoĂ n Táº¥t</Badge>;
      case "CANCELLED":
        return <Badge variant="outline">ÄĂ£ Há»§y</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">QUáº¢N LĂ Táº¤T Cáº¢ Äáº¶T BĂ€N</h1>
            <p className="text-zinc-400 text-xs mt-1">
              Xem toĂ n bá»™ lá»‹ch sá»­ vĂ  tĂ¬nh tráº¡ng Ä‘áº·t bĂ n tá»« táº¥t cáº£ ngÆ°á»i dĂ¹ng vĂ  nhĂ¢n viĂªn.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="TĂ¬m mĂ£ Ä‘áº·t bĂ n, khĂ¡ch hĂ ng, sá»‘ Ä‘iá»‡n thoáº¡i..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100"
            >
              <option value="">Táº¥t cáº£ tráº¡ng thĂ¡i</option>
              <option value="CONFIRMED">CONFIRMED (ÄĂ£ Giá»¯ Chá»—)</option>
              <option value="CHECKED_IN">CHECKED_IN (ÄĂ£ Äáº¿n)</option>
              <option value="IN_USE">IN_USE (Äang ChÆ¡i)</option>
              <option value="COMPLETED">COMPLETED (HoĂ n Táº¥t)</option>
              <option value="CANCELLED">CANCELLED (ÄĂ£ Há»§y)</option>
            </select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[650px]">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 whitespace-nowrap">MĂ£ Äáº·t</th>
                      <th className="p-3 whitespace-nowrap">BĂ n</th>
                      <th className="p-3 whitespace-nowrap">KhĂ¡ch HĂ ng</th>
                      <th className="p-3 whitespace-nowrap">Thá»i Gian Báº¯t Äáº§u</th>
                      <th className="p-3 whitespace-nowrap">Chi PhĂ­ Dá»± Kiáº¿n</th>
                      <th className="p-3 whitespace-nowrap">Tráº¡ng ThĂ¡i</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {bookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-zinc-900/50">
                        <td className="p-3 font-mono font-bold text-red-400 whitespace-nowrap">
                          {b.bookingCode}
                        </td>
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          BĂ n {b.billiardTable?.tableNumber}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-semibold text-zinc-200">
                            {b.customer?.fullName || "KhĂ¡ch Ä‘áº·t trÆ°á»›c"}
                          </div>
                          <div className="text-[11px] text-zinc-500">{b.customer?.phone}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap">{formatDateTimeVN(b.startTime)}</td>
                        <td className="p-3 font-bold text-red-400 whitespace-nowrap">
                          {formatVND(b.estimatedPrice)}
                        </td>
                        <td className="p-3 whitespace-nowrap">{statusBadge(b.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

