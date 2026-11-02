import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient, Role, UserStatus, Area, TableStatus, BookingStatus, SessionStatus, ServiceCategory, InvoiceStatus, InvoiceItemType, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function connectWithRetry(maxAttempts = 5) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await prisma.$connect();
      console.log('🔗 Đã kết nối cơ sở dữ liệu Neon thành công!');
      return;
    } catch (err) {
      if (i === maxAttempts) throw err;
      console.log(`⏳ Đang đánh thức DB (lần ${i}/${maxAttempts})... chờ 3s`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu cơ sở cho hệ thống Quản lý đặt bàn Bi-da...');
  await connectWithRetry();

  // 1. Tạo các tài khoản mẫu
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123456', salt);
  const staffPassword = await bcrypt.hash('Staff@123456', salt);
  const customerPassword = await bcrypt.hash('Khach@123456', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@billiards.local' },
    update: {},
    create: {
      email: 'admin@billiards.local',
      phone: '0909000001',
      fullName: 'Quản Trị Viên Hệ Thống',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff1@billiards.local' },
    update: {},
    create: {
      email: 'staff1@billiards.local',
      phone: '0909000002',
      fullName: 'Nhân Viên Thu Ngân 01',
      passwordHash: staffPassword,
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
    },
  });

  const waiterStaff = await prisma.user.upsert({
    where: { email: 'waiter@billiards.local' },
    update: {},
    create: {
      email: 'waiter@billiards.local',
      phone: '0909000005',
      fullName: 'Nhân Viên Phục Bàn',
      passwordHash: staffPassword,
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'khach1@gmail.com' },
    update: {},
    create: {
      email: 'khach1@gmail.com',
      phone: '0901234567',
      fullName: 'Nguyễn Văn An',
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'khach2@gmail.com' },
    update: {},
    create: {
      email: 'khach2@gmail.com',
      phone: '0912345678',
      fullName: 'Trần Thị Bích',
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Đã tạo tài khoản mẫu: Admin, Staff, Customer1, Customer2');

  // 2. Tạo loại bàn
  const poolType = await prisma.tableType.upsert({
    where: { code: 'POOL' },
    update: { hourlyRate: 80000 },
    create: {
      code: 'POOL',
      name: 'Bàn Bida Lỗ (Pool 9-Ball / 8-Ball)',
      hourlyRate: 80000,
      description: 'Bàn lỗ chuẩn thi đấu quốc tế 9ft, nỉ cao cấp Simonis, bóng Aramith',
      isActive: true,
    },
  });

  const caromType = await prisma.tableType.upsert({
    where: { code: 'CAROM_3C' },
    update: { hourlyRate: 90000 },
    create: {
      code: 'CAROM_3C',
      name: 'Bàn Bida Phăng / 3 Băng (Carom)',
      hourlyRate: 90000,
      description: 'Bàn Carom nhập khẩu có hệ thống sấy nhiệt tiêu chuẩn, mặt đá Hàn Quốc phẳng tuyệt đối',
      isActive: true,
    },
  });

  const snookerType = await prisma.tableType.upsert({
    where: { code: 'SNOOKER' },
    update: { hourlyRate: 120000 },
    create: {
      code: 'SNOOKER',
      name: 'Bàn Bida Snooker VIP',
      hourlyRate: 120000,
      description: 'Bàn Snooker 12ft chuẩn giải thế giới, phòng cách âm riêng biệt, ánh sáng chuẩn',
      isActive: true,
    },
  });

  const pool15Type = await prisma.tableType.upsert({
    where: { code: 'POOL_15B' },
    update: { hourlyRate: 85000 },
    create: {
      code: 'POOL_15B',
      name: 'Bàn Bida Lỗ 15 Bi (Pool 15-Ball)',
      hourlyRate: 85000,
      description: 'Bàn bida lỗ 15 bi tiêu chuẩn thi đấu (bộ 15 bi số + 1 bi cái), nỉ Simonis cao cấp, bóng Aramith Pro Cup',
      isActive: true,
    },
  });

  console.log('✅ Đã tạo các loại bàn: POOL (80k), POOL_15B (85k), CAROM_3C (90k), SNOOKER (120k)');

  // 3. Tạo các bàn bi-da vật lý
  const tablesData = [
    { tableNumber: 'B01', tableTypeId: poolType.id, area: Area.STANDARD, note: 'Gần quầy pha chế, tầm nhìn thoáng' },
    { tableNumber: 'B02', tableTypeId: poolType.id, area: Area.STANDARD, note: 'Khu vực máy lạnh 1' },
    { tableNumber: 'B03', tableTypeId: poolType.id, area: Area.STANDARD, note: 'Khu vực máy lạnh 2' },
    { tableNumber: 'B04', tableTypeId: poolType.id, area: Area.VIP, note: 'Phòng VIP riêng biệt, sofa sang trọng' },
    { tableNumber: 'B05', tableTypeId: caromType.id, area: Area.STANDARD, note: 'Bàn Carom Libre sưởi ấm' },
    { tableNumber: 'B06', tableTypeId: caromType.id, area: Area.STANDARD, note: 'Bàn Carom 3 Băng Min Table' },
    { tableNumber: 'B07', tableTypeId: caromType.id, area: Area.VIP, note: 'Phòng Carom VIP thi đấu' },
    { tableNumber: 'B08', tableTypeId: snookerType.id, area: Area.VIP, note: 'Phòng Snooker cao cấp' },
    { tableNumber: 'B09', tableTypeId: pool15Type.id, area: Area.STANDARD, note: 'Khu vực bida lỗ 15 bi tiêu chuẩn máy lạnh' },
    { tableNumber: 'B10', tableTypeId: pool15Type.id, area: Area.VIP, note: 'Phòng VIP bida lỗ 15 bi riêng tư cao cấp' },
  ];

  const createdTables = [];
  for (const t of tablesData) {
    const table = await prisma.billiardTable.upsert({
      where: { tableNumber: t.tableNumber },
      update: { tableTypeId: t.tableTypeId, area: t.area },
      create: {
        tableNumber: t.tableNumber,
        tableTypeId: t.tableTypeId,
        area: t.area,
        status: TableStatus.AVAILABLE,
        note: t.note,
      },
    });
    createdTables.push(table);
  }
  console.log(`✅ Đã tạo ${createdTables.length} bàn bi-da (B01 -> B08)`);

  // 4. Tạo dịch vụ / Menu đồ ăn nước uống
  const servicesData = [
    { code: 'DRK01', name: 'Nước suối Aquafina 500ml', category: ServiceCategory.DRINK, unitPrice: 15000, unit: 'Chai' },
    { code: 'DRK02', name: 'Nước ngọt Red Bull (Bò Húc)', category: ServiceCategory.DRINK, unitPrice: 25000, unit: 'Lon' },
    { code: 'DRK03', name: 'Trà Đào Cam Sả Đặc Biệt', category: ServiceCategory.DRINK, unitPrice: 35000, unit: 'Ly' },
    { code: 'DRK04', name: 'Cà phê đá truyền thống', category: ServiceCategory.DRINK, unitPrice: 25000, unit: 'Ly' },
    { code: 'FOD01', name: 'Mì xào bò trứng xúc xích', category: ServiceCategory.FOOD, unitPrice: 45000, unit: 'Dĩa' },
    { code: 'FOD02', name: 'Khoai tây chiên lắc phô mai', category: ServiceCategory.FOOD, unitPrice: 35000, unit: 'Dĩa' },
    { code: 'ACC01', name: 'Khăn lạnh hương quế', category: ServiceCategory.ACCESSORY, unitPrice: 5000, unit: 'Cái' },
    { code: 'ACC02', name: 'Thuê cơ thi đấu Predator Carbon', category: ServiceCategory.ACCESSORY, unitPrice: 40000, unit: 'Lượt' },
    { code: 'ACC03', name: 'Găng tay bida cao cấp co giãn 3 ngón', category: ServiceCategory.ACCESSORY, unitPrice: 35000, unit: 'Cái' },
    { code: 'ACC04', name: 'Lơ phấn bida Master USA chính hãng', category: ServiceCategory.ACCESSORY, unitPrice: 20000, unit: 'Viên' },
    { code: 'ACC05', name: 'Bao đựng cơ bida chống sốc', category: ServiceCategory.ACCESSORY, unitPrice: 150000, unit: 'Cái' },
  ];

  const createdServices = [];
  for (const s of servicesData) {
    const service = await prisma.serviceItem.upsert({
      where: { code: s.code },
      update: { unitPrice: s.unitPrice, isActive: true },
      create: s,
    });
    createdServices.push(service);
  }
  console.log(`✅ Đã tạo ${createdServices.length} món trong menu dịch vụ`);

  // 5. Cài đặt hệ thống (Business Settings)
  const settingsData = [
    { settingKey: 'OPENING_HOURS', settingValue: '08:00 - 24:00', description: 'Khung giờ hoạt động phục vụ khách hàng mỗi ngày' },
    { settingKey: 'PENDING_HOLD_MINUTES', settingValue: '15', description: 'Số phút giữ chỗ tối đa cho đơn đặt bàn trạng thái PENDING' },
    { settingKey: 'FREE_CANCELLATION_MINUTES', settingValue: '60', description: 'Thời gian hủy đặt bàn miễn phí tối thiểu trước giờ chơi (phút)' },
    { settingKey: 'MIN_BOOKING_MINUTES', settingValue: '60', description: 'Thời lượng đặt bàn tối thiểu (phút)' },
    { settingKey: 'MAX_BOOKING_MINUTES', settingValue: '360', description: 'Thời lượng đặt bàn tối đa cho 1 lượt đặt (phút)' },
    { settingKey: 'BILLING_ROUNDING_BLOCK', settingValue: '5', description: 'Làm tròn tính tiền giờ: 5 (5 phút), 15 (15 phút), EXACT (theo phút thực tế)' },
    { settingKey: 'BILLING_MIN_MINUTES', settingValue: '15', description: 'Thời gian chơi tối thiểu tính tiền (phút)' },
  ];

  for (const st of settingsData) {
    await prisma.businessSetting.upsert({
      where: { settingKey: st.settingKey },
      update: { settingValue: st.settingValue },
      create: st,
    });
  }
  console.log('✅ Đã tạo các cài đặt hệ thống (Business Settings)');

  // 6. Tạo một số Booking mẫu và Hóa đơn để có dữ liệu cho Dashboard & Báo cáo
  const now = new Date();
  
  // 6.1. Booking đã hoàn tất hôm nay (COMPLETED) + Hóa đơn đã thanh toán (PAID)
  const pastStart = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 giờ trước
  const pastEnd = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 giờ trước
  
  const completedBooking = await prisma.booking.upsert({
    where: { bookingCode: 'BKG-20261026-0001' },
    update: {},
    create: {
      bookingCode: 'BKG-20261026-0001',
      customerId: customer1.id,
      billiardTableId: createdTables[0].id, // B01 (80k/h)
      startTime: pastStart,
      endTime: pastEnd,
      estimatedPrice: 160000,
      actualPrice: 160000,
      status: BookingStatus.COMPLETED,
      notes: 'Khách quen, chơi 2 tiếng',
    },
  });

  const sampleSession = await prisma.playSession.upsert({
    where: { sessionCode: 'SES-20261026-0001' },
    update: {},
    create: {
      sessionCode: 'SES-20261026-0001',
      billiardTableId: createdTables[0].id,
      bookingId: completedBooking.id,
      startTime: pastStart,
      endTime: pastEnd,
      durationMinutes: 120,
      hourlyRateSnapshot: 80000,
      status: SessionStatus.FINISHED,
    },
  });

  const sampleInvoice = await prisma.invoice.upsert({
    where: { invoiceCode: 'INV-20261026-0001' },
    update: {},
    create: {
      invoiceCode: 'INV-20261026-0001',
      bookingId: completedBooking.id,
      sessionId: sampleSession.id,
      customerId: customer1.id,
      staffId: staff.id,
      tableAmount: 160000,
      serviceAmount: 75000,
      discountAmount: 0,
      finalAmount: 235000,
      status: InvoiceStatus.PAID,
      note: 'Thanh toán tiền mặt đầy đủ',
      paidAt: pastEnd,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: sampleInvoice.id,
        itemType: InvoiceItemType.TABLE_TIME,
        itemName: 'Tiền giờ chơi bàn B01 (120 phút)',
        unitPriceSnapshot: 80000,
        quantity: 2,
        subtotal: 160000,
      },
      {
        invoiceId: sampleInvoice.id,
        itemType: InvoiceItemType.SERVICE,
        serviceId: createdServices[1].id, // Bò húc
        itemName: 'Nước ngọt Red Bull (Bò Húc)',
        unitPriceSnapshot: 25000,
        quantity: 2,
        subtotal: 50000,
      },
      {
        invoiceId: sampleInvoice.id,
        itemType: InvoiceItemType.SERVICE,
        serviceId: createdServices[0].id, // Aquafina
        itemName: 'Nước suối Aquafina 500ml',
        unitPriceSnapshot: 15000,
        quantity: 1,
        subtotal: 15000,
      },
      {
        invoiceId: sampleInvoice.id,
        itemType: InvoiceItemType.SERVICE,
        serviceId: createdServices[6].id, // Khăn lạnh
        itemName: 'Khăn lạnh hương quế',
        unitPriceSnapshot: 5000,
        quantity: 2,
        subtotal: 10000,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.payment.upsert({
    where: { paymentCode: 'PAY-20261026-0001' },
    update: {},
    create: {
      paymentCode: 'PAY-20261026-0001',
      invoiceId: sampleInvoice.id,
      amount: 235000,
      method: PaymentMethod.CASH,
      status: PaymentStatus.SUCCESS,
      transactionRef: 'CASH-REC-01',
      note: 'Nhận tiền mặt tại quầy',
    },
  });

  // 6.2. Booking đã xác nhận sắp tới (CONFIRMED)
  const futureStart = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 giờ sau
  const futureEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 giờ sau
  
  await prisma.booking.upsert({
    where: { bookingCode: 'BKG-20261026-0002' },
    update: {},
    create: {
      bookingCode: 'BKG-20261026-0002',
      customerId: customer2.id,
      billiardTableId: createdTables[1].id, // B02
      startTime: futureStart,
      endTime: futureEnd,
      estimatedPrice: 160000,
      status: BookingStatus.CONFIRMED,
      notes: 'Đặt bàn trước 2 tiếng',
    },
  });

  console.log('✅ Đã tạo dữ liệu mẫu: Lịch sử chơi, Hóa đơn thực tế, Chi tiết thanh toán');

  // 7. Tạo quy tắc phụ thu mẫu (Chủ Nhật, Lễ Tết)
  const existingRules = await prisma.pricingRule.count();
  if (existingRules === 0) {
    await prisma.pricingRule.createMany({
      data: [
        {
          name: 'Phụ thu ngày Chủ Nhật (+15%)',
          ruleType: 'SUNDAY_ONLY',
          dayOfWeek: 0,
          surchargePercent: 15,
          fixedSurcharge: 0,
          description: 'Áp dụng tự động vào các ngày Chủ Nhật hàng tuần cho toàn bộ các loại bàn',
          isActive: true,
        },
        {
          name: 'Phụ thu Tết Nguyên Đán (+25%)',
          ruleType: 'HOLIDAY',
          startDate: new Date('2026-02-15T00:00:00.000Z'),
          endDate: new Date('2026-02-23T23:59:59.999Z'),
          surchargePercent: 25,
          fixedSurcharge: 0,
          description: 'Phụ thu ca Tết Nguyên Đán phục vụ xuyên Tết',
          isActive: true,
        },
        {
          name: 'Phụ thu Đại Lễ 30/4 - 1/5 (+20%)',
          ruleType: 'HOLIDAY',
          startDate: new Date('2026-04-30T00:00:00.000Z'),
          endDate: new Date('2026-05-03T23:59:59.999Z'),
          surchargePercent: 20,
          fixedSurcharge: 0,
          description: 'Áp dụng cho kỳ nghỉ lễ Giải Phóng Miền Nam & Quốc Tế Lao Động',
          isActive: true,
        },
      ],
    });
    console.log('✅ Đã tạo quy tắc phụ thu mẫu: Chủ Nhật (+15%), Tết (+25%), Lễ 30/4 (+20%)');
  }

  // 8. Cấu hình phân hạng thành viên & ưu đãi (Membership Tier Benefits)
  const tierBenefitsData = [
    {
      tier: 'STANDARD' as any,
      name: 'Hạng Chuẩn (Standard)',
      minSpending: 0,
      discountTablePercent: 0,
      discountServicePercent: 0,
      pointMultiplier: 1.0,
      description: 'Hạng thành viên mới đăng ký, tích lũy điểm tiêu chuẩn (10.000đ = 1 điểm)',
    },
    {
      tier: 'SILVER' as any,
      name: 'Hạng Bạc (Silver)',
      minSpending: 2000000,
      discountTablePercent: 5,
      discountServicePercent: 5,
      pointMultiplier: 1.2,
      description: 'Chi tiêu từ 2.000.000đ: Giảm 5% tiền giờ & F&B, điểm thưởng x1.2',
    },
    {
      tier: 'GOLD' as any,
      name: 'Hạng Vàng (Gold)',
      minSpending: 5000000,
      discountTablePercent: 10,
      discountServicePercent: 10,
      pointMultiplier: 1.5,
      description: 'Chi tiêu từ 5.000.000đ: Giảm 10% tiền giờ & F&B, điểm thưởng x1.5, ưu tiên đặt bàn trước',
    },
    {
      tier: 'VIP' as any,
      name: 'Hạng Kim Cương (VIP)',
      minSpending: 10000000,
      discountTablePercent: 15,
      discountServicePercent: 15,
      pointMultiplier: 2.0,
      description: 'Chi tiêu từ 10.000.000đ: Giảm 15% tiền giờ & F&B, điểm thưởng x2.0, quà sinh nhật đặc biệt',
    },
  ];

  for (const tb of tierBenefitsData) {
    await prisma.membershipTierBenefit.upsert({
      where: { tier: tb.tier },
      update: tb,
      create: tb,
    });
  }
  console.log('✅ Đã cấu hình phân hạng thành viên (Standard, Silver, Gold, VIP)');

  // 9. Tạo Vouchers / Mã giảm giá
  const vouchersData = [
    {
      code: 'CHAOMUNG20',
      name: 'Ưu đãi chào mừng khách mới (-20% tiền bàn)',
      discountType: 'PERCENT' as any,
      discountValue: 20,
      minOrderValue: 50000,
      maxDiscount: 50000,
      applicableTo: 'TABLE_ONLY',
      usageLimit: 100,
      description: 'Giảm 20% tiền giờ chơi cho khách hàng mới đến câu lạc bộ',
      isActive: true,
    },
    {
      code: 'ROYAL50K',
      name: 'Voucher tri ân trực tiếp (-50.000đ)',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 50000,
      minOrderValue: 150000,
      applicableTo: 'ALL',
      usageLimit: 50,
      description: 'Giảm ngay 50.000đ cho hóa đơn từ 150.000đ',
      isActive: true,
    },
    {
      code: 'FNB10',
      name: 'Ưu đãi ẩm thực (-10% món ăn & đồ uống)',
      discountType: 'PERCENT' as any,
      discountValue: 10,
      minOrderValue: 30000,
      maxDiscount: 30000,
      applicableTo: 'SERVICE_ONLY',
      usageLimit: 200,
      description: 'Giảm 10% toàn bộ đồ ăn, nước ngọt, bia cho nhóm bạn',
      isActive: true,
    },
    {
      code: 'VIPWEEKEND',
      name: 'Ưu đãi cuối tuần VIP (-15%)',
      discountType: 'PERCENT' as any,
      discountValue: 15,
      minOrderValue: 100000,
      maxDiscount: 100000,
      applicableTo: 'ALL',
      usageLimit: 30,
      description: 'Giảm 15% tổng hóa đơn các ngày Thứ 7 & Chủ Nhật',
      isActive: true,
    },
  ];

  for (const vc of vouchersData) {
    await prisma.voucher.upsert({
      where: { code: vc.code },
      update: vc,
      create: vc,
    });
  }
  console.log('✅ Đã tạo các mã Voucher khuyến mãi (CHAOMUNG20, ROYAL50K, FNB10, VIPWEEKEND)');

  // 10. Tạo Quà tặng đổi điểm (Loyalty Rewards)
  const rewardGiftsData = [
    {
      name: '01 Giờ chơi Bi-da Miễn Phí (Mọi loại bàn)',
      pointsRequired: 100,
      stockQuantity: 50,
      description: 'Đổi lấy 1 giờ chơi bi-da miễn phí áp dụng cho Bàn Lỗ, Carom hoặc Snooker.',
    },
    {
      name: 'Combo 02 Lon Nước Ngọt + 01 Bịch Snack',
      pointsRequired: 30,
      stockQuantity: 100,
      description: 'Thưởng thức 2 lon nước ngọt mát lạnh kèm snack khoai tây giòn rụm.',
    },
    {
      name: 'Lơ Bida Master USA Chính Hãng (Hộp 2 viên)',
      pointsRequired: 50,
      stockQuantity: 80,
      description: 'Lơ xanh Master USA siêu bám bi, chống trượt cơ hoàn hảo.',
    },
    {
      name: 'Găng Tay Bida Co Giãn Cao Cấp Chống Trượt',
      pointsRequired: 80,
      stockQuantity: 40,
      description: 'Găng tay vải thun lạnh thoáng khí, giúp đường cơ êm ái chính xác.',
    },
    {
      name: 'Bao Cơ Bida Simili Chống Sốc Chống Nước',
      pointsRequired: 250,
      stockQuantity: 20,
      description: 'Bao cơ 1 gốc 1 ngọn sang trọng, có quai đeo và ngăn đựng phụ kiện.',
    },
  ];

  for (const gift of rewardGiftsData) {
    const existingGift = await prisma.rewardGift.findFirst({ where: { name: gift.name } });
    if (!existingGift) {
      await prisma.rewardGift.create({ data: gift });
    }
  }
  console.log('✅ Đã tạo danh mục Quà tặng đổi điểm (Reward Gifts)');

  // 11. Cập nhật thông tin chi tiết khách hàng mẫu: SĐT, Ngày sinh, Tổng chi tiêu, Hạng thẻ, Tần suất chơi
  await prisma.user.update({
    where: { id: customer1.id },
    data: {
      dateOfBirth: new Date('1995-08-15'),
      membershipTier: 'GOLD' as any,
      points: 180,
      totalSpending: 5450000,
      visitCount: 14,
    },
  });

  await prisma.user.update({
    where: { id: customer2.id },
    data: {
      dateOfBirth: new Date('1998-11-20'),
      membershipTier: 'SILVER' as any,
      points: 75,
      totalSpending: 2350000,
      visitCount: 6,
    },
  });
  console.log('✅ Đã cập nhật khách hàng mẫu (Customer1: GOLD, Customer2: SILVER, ngày sinh, điểm tích lũy)');


  console.log('🎉 Seed dữ liệu thành công 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

