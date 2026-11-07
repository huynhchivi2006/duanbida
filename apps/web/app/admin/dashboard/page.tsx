"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import { RevenueStructureCard } from "@/components/analytics/revenue-structure-card";
import { TableUtilizationCard } from "@/components/analytics/table-utilization-card";
import {
  TableProperties,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  CalendarRange,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function AdminDashboardPage() {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const todayStr = now.toISOString().slice(0, 10);

  // TĂ­nh sá»‘ tuáº§n hiá»‡n táº¡i
  const firstDay = new Date(curY, 0, 1);
  const pastDays = (now.getTime() - firstDay.getTime()) / 86400000;
  const curWeek = Math.max(1, Math.ceil((pastDays + firstDay.getDay() + 1) / 7));
  const curQuarter = Math.floor((curM - 1) / 3) + 1;

  // State cĂ¡c bá»™ lá»c
  const [period, setPeriod] = useState<"day" | "week" | "month" | "quarter" | "year">("day");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedYear, setSelectedYear] = useState<number>(curY);
  const [selectedMonth, setSelectedMonth] = useState<number>(curM);
  const [selectedWeek, setSelectedWeek] = useState<number>(curWeek);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(curQuarter);

  // Query API dashboard summary
  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-dashboard-summary",
      period,
      selectedDate,
      selectedYear,
      selectedMonth,
      selectedWeek,
      selectedQuarter,
    ],
    queryFn: () => {
      const params: any = { period };
      if (period === "day") {
        params.date = selectedDate;
      } else if (period === "week") {
        params.year = selectedYear;
        params.week = selectedWeek;
      } else if (period === "month") {
        params.year = selectedYear;
        params.month = selectedMonth;
      } else if (period === "quarter") {
        params.year = selectedYear;
        params.quarter = selectedQuarter;
      } else if (period === "year") {
        params.year = selectedYear;
      }
      return apiClient("/dashboard/summary", { params });
    },
    refetchInterval: 15000,
  });

  const overview = data?.overview;
  const chartData = data?.chartData || [];
  const recentBookings = data?.recentBookings || [];

  const maxRevenue = Math.max(...chartData.map((c: any) => c.revenue), 100000);
  const totalChartRevenue = chartData.reduce((sum: number, c: any) => sum + Number(c.revenue || 0), 0);

  // Táº¡o danh sĂ¡ch 52 tuáº§n trong nÄƒm
  const weeksList = Array.from({ length: 52 }, (_, i) => i + 1);
  // Táº¡o danh sĂ¡ch 12 thĂ¡ng
  const monthsList = Array.from({ length: 12 }, (_, i) => i + 1);
  // Danh sĂ¡ch nÄƒm
  const yearsList = [2024, 2025, 2026, 2027];

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="ADMIN" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white">Tá»”NG QUAN Há»† THá»NG (ADMIN DASHBOARD)</h1>
              <p className="text-zinc-400 text-xs mt-1">
                Sá»‘ liá»‡u thá»‘ng kĂª thá»i gian thá»±c theo tá»«ng ngĂ y, tá»«ng tuáº§n, tá»«ng thĂ¡ng, tá»«ng quĂ½ vĂ  tá»«ng nÄƒm cá»¥ thá»ƒ.
              </p>
            </div>

            {/* Thanh Tab chá»n chu ká»³ */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <span className="text-zinc-500 font-semibold px-2">Xem theo:</span>
              {[
                { id: "day", label: "NgĂ y" },
                { id: "week", label: "Tuáº§n" },
                { id: "month", label: "ThĂ¡ng" },
                { id: "quarter", label: "QuĂ½" },
                { id: "year", label: "NÄƒm" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPeriod(item.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    period === item.id
                      ? "bg-red-600 text-white shadow-sm shadow-red-950"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bá»™ lá»c chi tiáº¿t cho tá»«ng chu ká»³ (Chá»n ngĂ y, chá»n tuáº§n 1 2 3..., chá»n thĂ¡ng 1 2 3...) */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <Filter className="h-4 w-4 text-red-400" />
                <span>
                  {period === "day" && "Chá»n ngĂ y cá»¥ thá»ƒ cáº§n xem:"}
                  {period === "week" && "Chá»n tuáº§n & nÄƒm cáº§n xem:"}
                  {period === "month" && "Chá»n thĂ¡ng & nÄƒm cáº§n xem:"}
                  {period === "quarter" && "Chá»n quĂ½ & nÄƒm cáº§n xem:"}
                  {period === "year" && "Chá»n nÄƒm cáº§n xem:"}
                </span>
              </div>

              {/* 1. Lá»c theo tá»«ng ngĂ y */}
              {period === "day" && (
                <div className="flex items-center gap-3">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-40 h-8 text-xs bg-zinc-950 border-zinc-700"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setSelectedDate(todayStr)}
                  >
                    Xem HĂ´m Nay
                  </Button>
                </div>
              )}

              {/* 2. Lá»c theo tá»«ng tuáº§n */}
              {period === "week" && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">NÄƒm:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Chá»n Tuáº§n:</span>
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(Number(e.target.value))}
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      {weeksList.map((w) => (
                        <option key={w} value={w}>
                          Tuáº§n {w} {w === curWeek && selectedYear === curY ? "(Tuáº§n hiá»‡n táº¡i)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 3. Lá»c theo tá»«ng thĂ¡ng (ThĂ¡ng 1, 2, 3, 4...) */}
              {period === "month" && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">NÄƒm:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Chá»n ThĂ¡ng:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      {monthsList.map((m) => (
                        <option key={m} value={m}>
                          ThĂ¡ng {m} {m === curM && selectedYear === curY ? "(ThĂ¡ng hiá»‡n táº¡i)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 4. Lá»c theo tá»«ng quĂ½ (QuĂ½ 1, 2, 3, 4) */}
              {period === "quarter" && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">NÄƒm:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Chá»n QuĂ½:</span>
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                    >
                      <option value={1}>QuĂ½ 1 (ThĂ¡ng 1 - ThĂ¡ng 3)</option>
                      <option value={2}>QuĂ½ 2 (ThĂ¡ng 4 - ThĂ¡ng 6)</option>
                      <option value={3}>QuĂ½ 3 (ThĂ¡ng 7 - ThĂ¡ng 9)</option>
                      <option value={4}>QuĂ½ 4 (ThĂ¡ng 10 - ThĂ¡ng 12)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 5. Lá»c theo tá»«ng nÄƒm */}
              {period === "year" && (
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Chá»n NÄƒm:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-100"
                  >
                    {yearsList.map((y) => (
                      <option key={y} value={y}>
                        NÄƒm {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Badge variant="outline" className="text-zinc-400 font-mono text-[11px] ml-auto">
                Äang xem: {overview?.periodTitle || "..."}
              </Badge>
            </div>
          </Card>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Doanh thu theo thá»i gian Ä‘Ă£ chá»n */}
            <Card className="border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 truncate">
                  Doanh Thu ({overview?.periodTitle || "Äang táº£i"})
                </span>
                <div className="p-2 rounded-lg bg-red-950/60 border border-red-800 text-red-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-red-400">
                {isLoading ? "..." : formatVND(overview?.periodRevenue || 0)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Tá»« {overview?.periodInvoicesCount || 0} hĂ³a Ä‘Æ¡n thanh toĂ¡n ({formatVND(overview?.periodTableAmount || 0)} tiá»n bĂ n)
              </div>
            </Card>

            {/* Card 2: Tá»· lá»‡ láº¥p Ä‘áº§y bĂ n */}
            <Card className="border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Tá»· Lá»‡ Láº¥p Äáº§y BĂ n Hiá»‡n Táº¡i</span>
                <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-400">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-white">
                {isLoading ? "..." : `${overview?.occupancyRate || 0}%`}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {overview?.occupiedTables || 0} / {overview?.totalTables || 0} bĂ n Ä‘ang chÆ¡i
              </div>
            </Card>

            {/* Card 3: LÆ°á»£t Ä‘áº·t bĂ n theo thá»i gian Ä‘Ă£ chá»n */}
            <Card className="border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 truncate">
                  LÆ°á»£t ChÆ¡i ({overview?.periodTitle || "Äang táº£i"})
                </span>
                <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-amber-400">
                {isLoading ? "..." : overview?.periodBookingsCount || 0}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {overview?.periodCompletedCount || 0} lÆ°á»£t chÆ¡i Ä‘Ă£ káº¿t thĂºc
              </div>
            </Card>

            {/* Card 4: Tá»•ng sá»‘ bĂ n bi-da */}
            <Card className="border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Tá»•ng Sá»‘ BĂ n Bi-da</span>
                <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-400">
                  <TableProperties className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-black text-white">
                {isLoading ? "..." : overview?.totalTables || 0}
              </div>
              <div className="text-[11px] text-red-400 mt-1">
                {overview?.availableTables || 0} bĂ n sáºµn sĂ ng phá»¥c vá»¥
              </div>
            </Card>
          </div>

          {/* Revenue Visual Chart Theo Chu Ká»³ ÄÆ°á»£c Chá»n */}
          <Card className="border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-400" />
                  {overview?.chartTitle || "Biá»ƒu Äá»“ Doanh Thu"}
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tá»•ng doanh thu trong chu ká»³:{" "}
                  <strong className="text-red-400 font-mono">
                    {formatVND(totalChartRevenue)}
                  </strong>
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-mono">
                {overview?.periodTitle || "Thá»‘ng kĂª"}
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <div className="h-56 flex items-end justify-between gap-2.5 pt-6 border-b border-zinc-800 pb-2">
                {chartData.map((d: any) => {
                  const heightPercent = Math.max(8, Math.round((d.revenue / maxRevenue) * 100));

                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] text-zinc-400 font-medium group-hover:text-red-400 transition-colors">
                        {d.revenue > 0 ? `${Math.round(d.revenue / 1000)}k` : "0"}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[48px] rounded-t-md bg-gradient-to-t from-red-700 to-red-400 transition-all group-hover:from-red-500 group-hover:to-red-300 shadow-sm shadow-red-950"
                        title={`${d.date}: ${formatVND(d.revenue)}`}
                      />
                      <span className="text-[10px] text-zinc-400 font-semibold group-hover:text-white transition-colors text-center truncate max-w-[64px]">
                        {d.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* PhĂ¢n TĂ­ch CÆ¡ Cáº¥u Doanh Thu: Tiá»n Giá» vs F&B vs BĂ¡n Phá»¥ Kiá»‡n */}
          <RevenueStructureCard
            data={data?.revenueStructure}
            isLoading={isLoading}
          />

          {/* Hiá»‡u Suáº¥t Khai ThĂ¡c BĂ n: 24h & Loáº¡i BĂ n Æ¯a Chuá»™ng */}
          <TableUtilizationCard
            data={data?.tableUtilization}
            isLoading={isLoading}
          />

          {/* Recent Bookings */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-400" />
                CĂ¡c LÆ°á»£t Äáº·t BĂ n Gáº§n Nháº¥t
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border border-zinc-800 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3">MĂ£ Äáº·t BĂ n</th>
                      <th className="p-3">KhĂ¡ch HĂ ng</th>
                      <th className="p-3">BĂ n</th>
                      <th className="p-3">Loáº¡i BĂ n</th>
                      <th className="p-3">Tráº¡ng ThĂ¡i</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {recentBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-zinc-900/50">
                        <td className="p-3 font-mono font-bold text-red-400">
                          {b.bookingCode}
                        </td>
                        <td className="p-3 font-medium text-white">
                          {b.customerName}
                        </td>
                        <td className="p-3 font-bold text-white">
                          BĂ n {b.tableNumber}
                        </td>
                        <td className="p-3 text-zinc-400">
                          {b.tableType}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              b.status === "CONFIRMED"
                                ? "success"
                                : b.status === "IN_USE"
                                ? "warning"
                                : b.status === "COMPLETED"
                                ? "default"
                                : "outline"
                            }
                          >
                            {b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
