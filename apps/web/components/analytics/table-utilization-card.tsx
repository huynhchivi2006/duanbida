"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/utils";
import { Flame, Trophy, Activity, Clock, TableProperties } from "lucide-react";

export interface HourlyOccupancy {
  hour: number;
  hourLabel: string;
  activeCount: number;
  occupancyRate: number;
  isPeak: boolean;
}

export interface PopularTableType {
  code: string;
  name: string;
  hourlyRate: number;
  tableCount: number;
  sessionCount: number;
  totalMinutes: number;
  totalRevenue: number;
  popularityPercent: number;
}

export interface TableUtilization {
  hourlyOccupancy?: HourlyOccupancy[];
  popularTableTypes?: PopularTableType[];
}

interface TableUtilizationCardProps {
  data?: TableUtilization;
  isLoading?: boolean;
}

export function TableUtilizationCard({ data, isLoading }: TableUtilizationCardProps) {
  const hourlyOccupancy = data?.hourlyOccupancy || [];
  const popularTableTypes = data?.popularTableTypes || [];

  const peakHours = hourlyOccupancy.filter((h) => h.isPeak);
  const maxOccupancy = Math.max(...hourlyOccupancy.map((h) => h.occupancyRate), 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Cá»™t 1: Tá»· lá»‡ láº¥p Ä‘áº§y bĂ n theo 24 khung giá» */}
      <Card className="lg:col-span-7 border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <CardHeader className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-400" />
              Tá»· Lá»‡ Láº¥p Äáº§y BĂ n Theo Khung Giá» (24 Giá»)
            </CardTitle>
            <p className="text-xs text-zinc-400 mt-1">
              PhĂ¢n tĂ­ch cĂ´ng suáº¥t khai thĂ¡c bĂ n tá»« 00:00 Ä‘áº¿n 23:00 trong ngĂ y
            </p>
          </div>

          {peakHours.length > 0 && (
            <Badge variant="warning" className="gap-1 text-[11px] self-start sm:self-center">
              <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              {peakHours.length} khung giá» cao Ä‘iá»ƒm (&ge;60%)
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          {isLoading ? (
            <div className="h-48 bg-zinc-950/60 rounded-xl animate-pulse" />
          ) : (
            <>
              {/* 24-Hour Bar Chart Visualization */}
              <div className="h-44 flex items-end gap-1.5 pt-6 border-b border-zinc-800 pb-2 px-1 overflow-x-auto">
                {hourlyOccupancy.map((item) => {
                  const heightPercent = Math.max(6, Math.round((item.occupancyRate / maxOccupancy) * 100));
                  return (
                    <div
                      key={item.hour}
                      className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-zinc-900 border border-zinc-700 px-2 py-1 rounded shadow-lg text-[10px] whitespace-nowrap pointer-events-none">
                        <span className="font-bold text-white">{item.hourLabel}</span>
                        <span className="text-red-400">
                          {item.occupancyRate}% ({item.activeCount} bĂ n hoáº¡t Ä‘á»™ng)
                        </span>
                        {item.isPeak && <span className="text-amber-400 font-semibold">Giá» Cao Äiá»ƒm đŸ”¥</span>}
                      </div>

                      <span className="text-[9px] text-zinc-500 font-mono group-hover:text-white transition-colors mb-1">
                        {item.occupancyRate > 0 ? `${item.occupancyRate}%` : ""}
                      </span>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all ${
                          item.isPeak
                            ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-sm shadow-amber-950/80 group-hover:from-amber-500 group-hover:to-amber-300"
                            : item.occupancyRate > 25
                            ? "bg-gradient-to-t from-red-700 to-red-400 group-hover:from-red-600 group-hover:to-red-300"
                            : "bg-zinc-800 group-hover:bg-zinc-700"
                        }`}
                      />

                      <span className="text-[9px] text-zinc-400 font-mono mt-1 group-hover:text-white">
                        {item.hour}h
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Peak Summary */}
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-zinc-700" />
                    <span className="text-[11px]">Tháº¥p (&lt;25%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-red-500" />
                    <span className="text-[11px]">BĂ¬nh thÆ°á»ng (25-59%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded bg-amber-400" />
                    <span className="text-[11px] font-bold text-amber-400">Cao Ä‘iá»ƒm (&ge;60% đŸ”¥)</span>
                  </div>
                </div>

                {peakHours.length > 0 && (
                  <div className="text-[11px] text-zinc-400">
                    Khung giá» sĂ´i Ä‘á»™ng nháº¥t:{" "}
                    <strong className="text-amber-400">
                      {peakHours.map((p) => `${p.hour}h`).join(", ")}
                    </strong>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cá»™t 2: Loáº¡i bĂ n Ä‘Æ°á»£c Æ°a chuá»™ng nháº¥t */}
      <Card className="lg:col-span-5 border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base text-zinc-100 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            Loáº¡i BĂ n ÄÆ°á»£c Æ¯a Chuá»™ng Nháº¥t
          </CardTitle>
          <p className="text-xs text-zinc-400 mt-1">
            Xáº¿p háº¡ng theo sá»‘ lÆ°á»£t chÆ¡i vĂ  tá»•ng thá»i gian khĂ¡ch sá»­ dá»¥ng bĂ n
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-950/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : popularTableTypes.length === 0 ? (
            <div className="text-center py-10 text-xs text-zinc-500">
              ChÆ°a cĂ³ dá»¯ liá»‡u phiĂªn chÆ¡i cho cĂ¡c loáº¡i bĂ n.
            </div>
          ) : (
            <div className="space-y-3">
              {popularTableTypes.map((t, idx) => {
                const hoursPlayed = (t.totalMinutes / 60).toFixed(1);
                return (
                  <div
                    key={t.code || idx}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                            idx === 0
                              ? "bg-amber-500 text-black"
                              : idx === 1
                              ? "bg-zinc-300 text-black"
                              : idx === 2
                              ? "bg-amber-700 text-white"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {t.name}
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({t.code})
                            </span>
                          </div>
                          <span className="text-[11px] text-red-400 font-medium">
                            {formatVND(t.hourlyRate)}/giá» &bull; {t.tableCount} bĂ n
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-white">
                          {t.sessionCount} lÆ°á»£t chÆ¡i
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {hoursPlayed} giá» chÆ¡i
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Popularity */}
                    <div className="space-y-1">
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            idx === 0
                              ? "bg-amber-500"
                              : idx === 1
                              ? "bg-red-500"
                              : "bg-sky-500"
                          }`}
                          style={{ width: `${Math.max(4, t.popularityPercent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                        <span>Chiáº¿m {t.popularityPercent}% tá»•ng lÆ°á»£t chÆ¡i</span>
                        <span className="text-red-400 font-bold">
                          {formatVND(t.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

