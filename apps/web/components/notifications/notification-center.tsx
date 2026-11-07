"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Bell, CheckCheck, X, Sparkles, CalendarDays, Award } from "lucide-react";
import { cn } from "@/lib/utils";

// PhĂ¡t Ă¢m thanh thĂ´ng bĂ¡o nháº¹ nhĂ ng qua Web Audio API (khĂ´ng cáº§n file Ă¢m thanh ngoĂ i)
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // KhĂ´ng lĂ m giĂ¡n Ä‘oáº¡n náº¿u trĂ¬nh duyá»‡t cháº·n autoplay audio
  }
}

export function NotificationCenter({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const previousNotifIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Chá»‰ kĂ­ch hoáº¡t cho nhĂ¢n viĂªn hoáº·c quáº£n trá»‹ viĂªn
  const isStaffOrAdmin = user?.role === "STAFF" || user?.role === "ADMIN";

  const { data: notifications = [] } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => apiClient("/notifications"),
    enabled: Boolean(user && isStaffOrAdmin),
    refetchInterval: 5000, // ThÄƒm dĂ² thĂ´ng bĂ¡o má»›i má»—i 5 giĂ¢y
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Theo dĂµi thĂ´ng bĂ¡o má»›i Ä‘á»ƒ báº¯n Toast ná»•i vĂ  phĂ¡t tiáº¿ng chuĂ´ng
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    if (isFirstLoadRef.current) {
      notifications.forEach((n: any) => previousNotifIdsRef.current.add(n.id));
      isFirstLoadRef.current = false;
      return;
    }

    // TĂ¬m thĂ´ng bĂ¡o má»›i xuáº¥t hiá»‡n
    const newestUnread = notifications.find(
      (n: any) => !previousNotifIdsRef.current.has(n.id) && !n.isRead
    );

    if (newestUnread) {
      previousNotifIdsRef.current.add(newestUnread.id);
      setActiveToast(newestUnread);
      playNotificationChime();

      // Tá»± Ä‘á»™ng lĂ m má»›i danh sĂ¡ch bĂ n & lá»‹ch Ä‘áº·t khi cĂ³ sá»± kiá»‡n má»›i
      queryClient.invalidateQueries({ queryKey: ["staff-tables"] });
      queryClient.invalidateQueries({ queryKey: ["staff-bookings"] });

      // Tá»± Ä‘á»™ng áº©n Toast sau 8 giĂ¢y
      const timer = setTimeout(() => {
        setActiveToast((prev: any) => (prev?.id === newestUnread.id ? null : prev));
      }, 8000);
      return () => clearTimeout(timer);
    }

    notifications.forEach((n: any) => previousNotifIdsRef.current.add(n.id));
  }, [notifications, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });

  if (!isStaffOrAdmin) return null;

  return (
    <>
      {/* NĂºt ChuĂ´ng ThĂ´ng BĂ¡o */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="ThĂ´ng bĂ¡o há»‡ thá»‘ng"
          className={cn(
            "relative flex items-center justify-center rounded-lg transition-colors",
            isCollapsed
              ? "h-10 w-10 mx-auto hover:bg-zinc-900 text-zinc-300"
              : "w-full gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900"
          )}
        >
          <div className="relative shrink-0">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between">
              <span>ThĂ´ng bĂ¡o ca</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-rose-950/80 border border-rose-800/80 text-rose-300 px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount} má»›i
                </span>
              )}
            </div>
          )}
        </button>

        {/* Dropdown danh sĂ¡ch thĂ´ng bĂ¡o */}
        {isOpen && (
          <div
            className={cn(
              "absolute z-50 bottom-12 w-80 max-h-96 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col text-xs animate-in fade-in slide-in-from-bottom-2",
              isCollapsed ? "left-14" : "left-0"
            )}
          >
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-red-400" />
                <span>ThĂ´ng BĂ¡o Ca Trá»±c</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Äá»c háº¿t
                </button>
              )}
            </div>

            <div className="overflow-y-auto p-2 space-y-1.5 flex-1 divide-y divide-zinc-900">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  ChÆ°a cĂ³ thĂ´ng bĂ¡o nĂ o trong ca
                </div>
              ) : (
                notifications.map((n: any) => {
                  const isBooking = n.type === "NEW_BOOKING";
                  const isStaff = n.type === "STAFF_ASSIGNED";
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                      className={cn(
                        "p-2.5 rounded-lg cursor-pointer transition-colors space-y-1",
                        n.isRead
                          ? "opacity-60 hover:opacity-100 hover:bg-zinc-900/40"
                          : "bg-zinc-900/90 border border-zinc-800 hover:border-red-500/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "font-bold text-[11px]",
                            isBooking ? "text-red-400" : isStaff ? "text-amber-400" : "text-sky-400"
                          )}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-red-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{n.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Toast ThĂ´ng BĂ¡o Thá»i Gian Thá»±c (GĂ³c TrĂªn Pháº£i) */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full animate-in slide-in-from-top duration-300">
          <div className="p-4 rounded-2xl bg-zinc-950/95 border-2 border-red-500 text-white shadow-2xl shadow-black/80 backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400 font-bold text-lg">
                {activeToast.type === "NEW_BOOKING" ? "đŸ””" : "đŸ±"}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-400 bg-red-950 px-2 py-0.5 rounded-full border border-red-800/80">
                    {activeToast.type === "NEW_BOOKING" ? "KhĂ¡ch Äáº·t BĂ n Má»›i" : "PhĂ¢n CĂ´ng Phá»¥c Vá»¥"}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{activeToast.title}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{activeToast.message}</p>
              </div>
              <button
                onClick={() => setActiveToast(null)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

