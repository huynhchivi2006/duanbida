import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CircleDot, Calendar, ShieldCheck, Zap, Award, Clock, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-zinc-950 to-zinc-950 -z-10"></div>
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Hệ thống đặt bàn thời gian thực - Chống trùng lịch 100%
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
              TRẢI NGHIỆM BI-DA ĐẲNG CẤP TẠI{" "}
              <span className="text-emerald-500 underline decoration-emerald-600/50 font-azonix tracking-wider">ROYAL CLUB</span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Không gian thi đấu sang trọng, mặt đá phẳng tuyệt đối, cơ thi đấu Predator cao cấp.
              Tra cứu bàn trống và đặt chỗ giữ bàn chỉ trong 30 giây.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/book">
                <Button size="lg" className="text-base px-8 font-semibold shadow-lg shadow-emerald-900/40">
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt Bàn Ngay Bây Giờ
                </Button>
              </Link>
              <Link href="/tables">
                <Button variant="outline" size="lg" className="text-base px-6">
                  Xem Sơ Đồ & Bảng Giá
                </Button>
              </Link>
            </div>

            {/* Quick stats banner */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
                <div className="text-2xl md:text-3xl font-black text-emerald-400">8+</div>
                <div className="text-xs text-zinc-400 mt-1">Bàn Thi Đấu Chuẩn</div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
                <div className="text-2xl md:text-3xl font-black text-emerald-400">100%</div>
                <div className="text-xs text-zinc-400 mt-1">Nỉ Simonis Nhập Khẩu</div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
                <div className="text-2xl md:text-3xl font-black text-emerald-400">0s</div>
                <div className="text-xs text-zinc-400 mt-1">Thời Gian Chờ Giữ Chỗ</div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50">
                <div className="text-2xl md:text-3xl font-black text-emerald-400">16h/24h</div>
                <div className="text-xs text-zinc-400 mt-1">Giờ Mở Cửa (08:00 - 24:00)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Table Categories Section */}
        <section className="py-16 bg-zinc-950 border-b border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">CÁC LOẠI HÌNH BÀN CHƠI</h2>
              <p className="text-zinc-400 text-sm mt-2">
                Trang thiết bị chuẩn quốc tế phục vụ từ giải trí đến tập luyện thi đấu chuyên nghiệp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pool */}
              <Card className="border-zinc-800 bg-zinc-900/40 hover:border-emerald-600/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold mb-2">
                    8
                  </div>
                  <CardTitle>Bàn Bida Lỗ (Pool 9-Ball)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Kích thước chuẩn 9ft, bóng Aramith Pro Cup TV, băng cao su Artemis chuẩn độ nảy, góc lỗ sắc nét.
                  </p>
                  <div className="flex items-baseline justify-between border-t border-zinc-800/80 pt-4">
                    <span className="text-xs text-zinc-400">Giá thuê chỉ từ:</span>
                    <span className="text-lg font-bold text-emerald-400">80.000 ₫ / giờ</span>
                  </div>
                  <Link href="/book?type=POOL" className="block">
                    <Button variant="secondary" className="w-full text-xs" size="sm">
                      Đặt Bàn Này <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Carom */}
              <Card className="border-zinc-800 bg-zinc-900/40 hover:border-emerald-600/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold mb-2">
                    3C
                  </div>
                  <CardTitle>Bàn Phăng / 3 Băng (Carom)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Mặt đá Hàn Quốc nguyên khối phẳng tuyệt đối, tích hợp hệ thống sưởi nhiệt phim Carbon hiện đại.
                  </p>
                  <div className="flex items-baseline justify-between border-t border-zinc-800/80 pt-4">
                    <span className="text-xs text-zinc-400">Giá thuê chỉ từ:</span>
                    <span className="text-lg font-bold text-emerald-400">90.000 ₫ / giờ</span>
                  </div>
                  <Link href="/book?type=CAROM_3C" className="block">
                    <Button variant="secondary" className="w-full text-xs" size="sm">
                      Đặt Bàn Này <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Snooker */}
              <Card className="border-zinc-800 bg-zinc-900/40 hover:border-emerald-600/50 transition-all">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold mb-2">
                    SN
                  </div>
                  <CardTitle>Bàn Snooker VIP Quốc Tế</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Kích thước đại 12ft, phòng VIP riêng biệt, điều hòa công suất lớn, sofa tiếp khách thượng lưu.
                  </p>
                  <div className="flex items-baseline justify-between border-t border-zinc-800/80 pt-4">
                    <span className="text-xs text-zinc-400">Giá thuê chỉ từ:</span>
                    <span className="text-lg font-bold text-emerald-400">120.000 ₫ / giờ</span>
                  </div>
                  <Link href="/book?type=SNOOKER" className="block">
                    <Button variant="secondary" className="w-full text-xs" size="sm">
                      Đặt Bàn Này <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 bg-zinc-900/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Đảm Bảo Khung Giờ</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Khi đã đặt bàn thành công, khung giờ của bạn được khóa bảo vệ trên database. Không bao giờ lo bị trùng hoặc mất bàn.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 shrink-0">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Minh Bạch & Rõ Ràng</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Xem trước chi phí dự kiến trước khi xác nhận. Hóa đơn tính chính xác từng phút với snapshot giá công khai.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-100">Chính Sách Linh Hoạt</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Dễ dàng hủy hoặc thay đổi lịch hẹn trước giờ bắt đầu 60 phút hoàn toàn miễn phí.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

