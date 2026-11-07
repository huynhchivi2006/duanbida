"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDateTimeVN } from "@/lib/utils";
import { Receipt } from "lucide-react";

export default function CustomerInvoicesPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["my-invoices"],
    queryFn: () => apiClient("/invoices/my"),
  });

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">
      <Sidebar role="CUSTOMER" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Lá»CH Sá»¬ HĂ“A ÄÆ N & THANH TOĂN</h1>
            <p className="text-zinc-400 text-xs mt-1">
              Xem láº¡i toĂ n bá»™ cĂ¡c hĂ³a Ä‘Æ¡n Ä‘Ă£ thanh toĂ¡n vĂ  chi tiáº¿t giá» chÆ¡i táº¡i cĂ¢u láº¡c bá»™.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <Card className="text-center py-16 border-zinc-800 bg-zinc-900/40">
              <Receipt className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-300">ChÆ°a cĂ³ hĂ³a Ä‘Æ¡n nĂ o</h3>
              <p className="text-xs text-zinc-500 mt-1">
                CĂ¡c hĂ³a Ä‘Æ¡n sau khi báº¡n káº¿t thĂºc lÆ°á»£t chÆ¡i táº¡i quĂ¡n sáº½ Ä‘Æ°á»£c hiá»ƒn thá»‹ Ä‘áº§y Ä‘á»§ táº¡i Ä‘Ă¢y.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv: any) => (
                <Card key={inv.id} className="border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-red-400 text-sm">
                          {inv.invoiceCode}
                        </span>
                        <Badge variant={inv.status === "PAID" ? "success" : "warning"}>
                          {inv.status === "PAID" ? "ÄĂ£ Thanh ToĂ¡n" : "ChÆ°a Thanh ToĂ¡n"}
                        </Badge>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Thá»i gian: {formatDateTimeVN(inv.createdAt)}
                      </div>
                      <div className="mt-2 text-xs space-y-1">
                        {inv.invoiceItems?.map((item: any) => (
                          <div key={item.id} className="text-zinc-300 flex gap-2">
                            <span>â€¢ {item.itemName} (x{item.quantity})</span>
                            <span className="text-zinc-500">-</span>
                            <span className="text-zinc-400">{formatVND(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6">
                      <div className="text-xs text-zinc-400">Tá»•ng thanh toĂ¡n:</div>
                      <div className="text-lg font-black text-red-400">
                        {formatVND(inv.finalAmount)}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        {inv.payments?.[0]?.method || "Tiá»n máº·t"}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

