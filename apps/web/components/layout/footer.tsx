import Link from "next/link";
import { CircleDot, Phone, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 text-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                <CircleDot className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-base tracking-wider font-azonix text-zinc-100">
                ROYAL <span className="text-emerald-500">BILLIARDS</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Câu lạc bộ bi-da chuẩn thi đấu quốc tế. Không gian đẳng cấp, bàn nỉ cao cấp Simonis, dịch vụ chu đáo 24/7.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-zinc-200 font-semibold text-sm">Liên Kết Nhanh</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/tables" className="hover:text-emerald-400">
                  Danh sách bàn & bảng giá
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-emerald-400">
                  Đặt bàn trước trực tuyến
                </Link>
              </li>
              <li>
                <Link href="/lookup" className="hover:text-emerald-400">
                  Tra cứu tình trạng đặt bàn
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-zinc-200 font-semibold text-sm">Thông Tin Liên Hệ</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>123 Đường Số 7, Phường Tân Phong, Quận 7, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Hotline đặt bàn: 0909 888 999</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Mở cửa: 08:00 - 24:00 hàng ngày</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-zinc-200 font-semibold text-sm">Chính Sách Đặt Bàn</h4>
            <p className="text-xs leading-relaxed text-zinc-400">
              - Giữ chỗ tối đa 15 phút sau giờ hẹn.
              <br />
              - Hủy bàn miễn phí trước giờ chơi ít nhất 60 phút.
              <br />
              - Hệ thống tự động chống trùng lịch đặt theo thời gian thực.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Royal Billiards Management System. Đồ án môn học Lập trình Mã Nguồn Mở.
        </div>
      </div>
    </footer>
  );
}

