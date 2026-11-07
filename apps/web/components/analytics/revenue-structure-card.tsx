"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";
import { Clock, Utensils, Package, Layers, PieChart } from "lucide-react";

export interface RevenueStructure {
  tableRevenue: number;
  fnbRevenue: number;
  accessoryRevenue: number;
  otherRevenue: number;
  tablePercent: number;
  fnbPercent: number;
  accessoryPercent: number;
  otherPercent: number;
}

interface RevenueStructureCardProps {
  data?: RevenueStructure;
  isLoading?: boolean;
}

export function RevenueStructureCard({ data, isLoading }: RevenueStructureCardProps) {
  const tableRev = data?.tableRevenue || 0;
  const fnbRev = data?.fnbRevenue || 0;
  const accRev = data?.accessoryRevenue || 0;
  const otherRev = data?.otherRevenue || 0;

  const tablePct = data?.tablePercent ?? 0;
  const fnbPct = data?.fnbPercent ?? 0;
  const accPct = data?.accessoryPercent ?? 0;
  const otherPct = data?.otherPercent ?? 0;

  const total = tableRev + fnbRev + accRev + otherRev;

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
      <CardHeader className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-red-400" />
            CÆ¡ Cáº¥u Doanh Thu: Tiá»n Giá» vs F&B vs BĂ¡n Phá»¥ Kiá»‡n
          </CardTitle>
          <p className="text-xs text-zinc-400 mt-1">
            PhĂ¢n tĂ­ch tá»· trá»ng Ä‘Ă³ng gĂ³p vĂ o tá»•ng doanh thu kinh doanh cá»§a cĂ¢u láº¡c bá»™
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-zinc-400">Tá»•ng doanh thu gá»™p:</span>
          <div className="text-lg font-black text-red-400">
            {isLoading ? "..." : formatVND(total)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-5">
        {/* Visual Multi-Segment Bar */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-zinc-950 rounded-full overflow-hidden flex p-0.5 border border-zinc-800">
            {total === 0 ? (
              <div className="w-full h-full bg-zinc-800 rounded-full" />
            ) : (
              <>
                <div
                  style={{ width: `${tablePct}%` }}
                  className="bg-red-500 h-full rounded-l-full transition-all"
                  title={`Tiá»n Giá»: ${tablePct}%`}
                />
                <div
                  style={{ width: `${fnbPct}%` }}
                  className="bg-sky-500 h-full transition-all"
                  title={`F&B: ${fnbPct}%`}
                />
                <div
                  style={{ width: `${accPct}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Phá»¥ Kiá»‡n: ${accPct}%`}
                />
                <div
                  style={{ width: `${otherPct}%` }}
                  className="bg-purple-500 h-full rounded-r-full transition-all"
                  title={`KhĂ¡c: ${otherPct}%`}
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Tiá»n Giá» ({tablePct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span>F&B Äá»“ Ä‚n/Uá»‘ng ({fnbPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Phá»¥ Kiá»‡n Bi-da ({accPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Dá»‹ch Vá»¥ KhĂ¡c ({otherPct}%)</span>
            </div>
          </div>
        </div>

        {/* 4 Detail Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Tiá»n giá» bĂ n */}
          <div className="rounded-xl border border-red-950/80 bg-zinc-950/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-zinc-200">Tiá»n Giá» BĂ n</span>
              </div>
              <Badge variant="outline" className="text-red-400 border-red-800 text-[10px]">
                {tablePct}%
              </Badge>
            </div>
            <div className="text-lg font-black text-white">
              {isLoading ? "..." : formatVND(tableRev)}
            </div>
            <p className="text-[11px] text-zinc-500">
              Thu tá»« thá»i gian khĂ¡ch Ä‘Ă¡nh bi-da theo block
            </p>
          </div>

          {/* 2. Tiá»n F&B */}
          <div className="rounded-xl border border-sky-950/80 bg-zinc-950/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <Utensils className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-zinc-200">F&B áº¨m Thá»±c</span>
              </div>
              <Badge variant="outline" className="text-sky-400 border-sky-800 text-[10px]">
                {fnbPct}%
              </Badge>
            </div>
            <div className="text-lg font-black text-white">
              {isLoading ? "..." : formatVND(fnbRev)}
            </div>
            <p className="text-[11px] text-zinc-500">
              NÆ°á»›c giáº£i khĂ¡t, cafe, Ä‘á»“ Äƒn nhanh, mĂ¬, snack
            </p>
          </div>

          {/* 3. Phá»¥ kiá»‡n bi-da */}
          <div className="rounded-xl border border-amber-950/80 bg-zinc-950/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Package className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-zinc-200">BĂ¡n Phá»¥ Kiá»‡n</span>
              </div>
              <Badge variant="outline" className="text-amber-400 border-amber-800 text-[10px]">
                {accPct}%
              </Badge>
            </div>
            <div className="text-lg font-black text-white">
              {isLoading ? "..." : formatVND(accRev)}
            </div>
            <p className="text-[11px] text-zinc-500">
              LÆ¡ xanh Master/Taom, gÄƒng tay, bao cÆ¡, phá»¥ kiá»‡n
            </p>
          </div>

          {/* 4. KhĂ¡c */}
          <div className="rounded-xl border border-purple-950/80 bg-zinc-950/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-zinc-200">Dá»‹ch Vá»¥ KhĂ¡c</span>
              </div>
              <Badge variant="outline" className="text-purple-400 border-purple-800 text-[10px]">
                {otherPct}%
              </Badge>
            </div>
            <div className="text-lg font-black text-white">
              {isLoading ? "..." : formatVND(otherRev)}
            </div>
            <p className="text-[11px] text-zinc-500">
              NhĂ¢n viĂªn xáº¿p bi trá»£ giĂºp, phá»¥ thu giá» cao Ä‘iá»ƒm
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

