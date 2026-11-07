"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import { Filter, Sparkles, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface BilliardTable {
  id: string;
  tableNumber: string;
  area: "STANDARD" | "VIP" | "OUTDOOR";
  hourlyRate?: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
  note?: string;
  tableType: {
    id: string;
    code: string;
    name: string;
    hourlyRate: number;
  };
}

export default function TablesPage() {
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const { data: tables = [], isLoading, isError } = useQuery<BilliardTable[]>({
    queryKey: ["tables"],
    queryFn: () => apiClient("/tables"),
  });

  const filteredTables = tables.filter((t) => {
    if (selectedArea !== "ALL" && t.area !== selectedArea) return false;
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;
    return true;
  });

  const statusBadge = (status: BilliardTable["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">BĂ n Trá»‘ng (Sáºµn SĂ ng)</Badge>;
      case "OCCUPIED":
        return <Badge variant="danger">Äang CĂ³ KhĂ¡ch ChÆ¡i</Badge>;
      case "RESERVED":
        return <Badge variant="warning">ÄĂ£ CĂ³ KhĂ¡ch Äáº·t</Badge>;
      case "MAINTENANCE":
        return <Badge variant="default">Äang Báº£o TrĂ¬</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-black text-white">DANH SĂCH BĂ€N BI-DA & Báº¢NG GIĂ</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Theo dĂµi tráº¡ng thĂ¡i thá»i gian thá»±c vĂ  Ä‘áº·t bĂ n ngay trÆ°á»›c khi Ä‘áº¿n quĂ¡n.
          </p>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mr-2">
              <Filter className="h-4 w-4 text-red-400" />
              Lá»c theo:
            </div>

            {/* Area Filter */}
            <div className="flex items-center gap-1">
              {["ALL", "STANDARD", "VIP"].map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    selectedArea === area
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {area === "ALL" ? "Táº¥t cáº£ khu vá»±c" : area === "VIP" ? "PhĂ²ng VIP" : "Khu ThÆ°á»ng"}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 ml-auto">
              {["ALL", "AVAILABLE", "OCCUPIED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    selectedStatus === st
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {st === "ALL" ? "Má»i tráº¡ng thĂ¡i" : st === "AVAILABLE" ? "BĂ n trá»‘ng" : "Äang chÆ¡i"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse p-4"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            KhĂ´ng thá»ƒ táº£i dá»¯ liá»‡u bĂ n tá»« mĂ¡y chá»§. Vui lĂ²ng kiá»ƒm tra láº¡i káº¿t ná»‘i.
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">
            KhĂ´ng cĂ³ bĂ n nĂ o phĂ¹ há»£p vá»›i bá»™ lá»c hiá»‡n táº¡i.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {filteredTables.map((table) => (
              <Card
                key={table.id}
                className="border-zinc-800 bg-zinc-900/60 hover:border-red-600/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-black text-white tracking-wider">
                      {table.tableNumber}
                    </span>
                    {statusBadge(table.status)}
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <div className="font-semibold text-zinc-100">{table.tableType.name}</div>
                    <div className="text-zinc-400">
                      Khu vá»±c:{" "}
                      <span className="text-zinc-200 font-medium">
                        {table.area === "VIP" ? "PhĂ²ng VIP Cao Cáº¥p" : "Khu Vá»±c TiĂªu Chuáº©n"}
                      </span>
                    </div>
                    {table.note && (
                      <p className="text-[11px] text-zinc-500 italic mt-1">{table.note}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400">ÄÆ¡n giĂ¡:</div>
                    <div className="text-sm font-bold text-red-400">
                      {formatVND(table.hourlyRate || table.tableType.hourlyRate)}/h
                    </div>
                  </div>

                  <Link href={`/book?tableId=${table.id}`}>
                    <Button
                      size="sm"
                      variant={table.status === "AVAILABLE" ? "primary" : "outline"}
                      className="text-xs"
                      disabled={table.status === "MAINTENANCE"}
                    >
                      {table.status === "AVAILABLE" ? "Äáº·t BĂ n" : "Xem Lá»‹ch"}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

