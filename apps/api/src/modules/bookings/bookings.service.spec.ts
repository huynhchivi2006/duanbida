import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { BookingStatus, Role, TableStatus } from '@prisma/client';

describe('BookingsService (Unit Tests & Concurrency Logic)', () => {
  let bookingsService: BookingsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      billiardTable: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      bookingStatusHistory: {
        create: jest.fn(),
      },
      playSession: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prisma);
      }),
      $queryRaw: jest.fn(),
      tableType: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    bookingsService = module.get<BookingsService>(BookingsService);
  });

  describe('Chống trùng lịch đặt bàn (Anti-Overlap Check)', () => {
    const tableId = 'table-uuid-1';
    const mockUser = { id: 'cust-1', role: Role.CUSTOMER };

    it('Từ chối yêu cầu (409 Conflict) khi khung giờ bị trùng với một lượt đặt khác', async () => {
      // Mock bảng tồn tại và không bảo trì
      prisma.$queryRaw.mockResolvedValue([
        {
          id: tableId,
          table_number: 'B01',
          table_type_id: 'type-1',
          status: TableStatus.AVAILABLE,
        },
      ]);

      prisma.tableType.findUnique.mockResolvedValue({
        id: 'type-1',
        hourlyRate: 80000,
      });

      const futureDate = new Date(Date.now() + 24 * 3600 * 1000);
      const startIso = futureDate.toISOString();
      const endIso = new Date(futureDate.getTime() + 2 * 3600 * 1000).toISOString();

      // Giả lập đã có booking từ 14:00 đến 16:00
      prisma.booking.findMany.mockResolvedValue([
        {
          id: 'existing-booking',
          billiardTableId: tableId,
          startTime: new Date(startIso),
          endTime: new Date(endIso),
          status: BookingStatus.CONFIRMED,
        },
      ]);

      // Yêu cầu đặt chồng lấn
      await expect(
        bookingsService.create(
          {
            billiardTableId: tableId,
            startTime: startIso,
            durationMinutes: 120,
          },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('Chấp nhận đặt bàn thành công khi khung giờ hoàn toàn trống', async () => {
      const futureDate = new Date(Date.now() + 48 * 3600 * 1000);
      const startIso = futureDate.toISOString();
      const endIso = new Date(futureDate.getTime() + 2 * 3600 * 1000).toISOString();

      prisma.$queryRaw.mockResolvedValue([
        {
          id: tableId,
          table_number: 'B01',
          table_type_id: 'type-1',
          status: TableStatus.AVAILABLE,
        },
      ]);

      prisma.tableType.findUnique.mockResolvedValue({
        id: 'type-1',
        hourlyRate: 80000,
      });

      // Không có booking nào trùng lặp
      prisma.booking.findMany.mockResolvedValue([]);

      prisma.booking.create.mockResolvedValue({
        id: 'new-bkg-id',
        bookingCode: 'BKG-20261027-1234',
        billiardTableId: tableId,
        customerId: mockUser.id,
        startTime: new Date(startIso),
        endTime: new Date(endIso),
        estimatedPrice: 160000,
        status: BookingStatus.CONFIRMED,
      });

      const result = await bookingsService.create(
        {
          billiardTableId: tableId,
          startTime: startIso,
          durationMinutes: 120,
        },
        mockUser,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('Chính sách hủy đặt bàn (Cancellation Policy)', () => {
    it('Khách hàng bị từ chối tự hủy khi thời gian bắt đầu còn dưới 60 phút', async () => {
      const now = new Date();
      const nearFuture = new Date(now.getTime() + 30 * 60 * 1000); // Còn 30 phút nữa bắt đầu

      jest.spyOn(bookingsService, 'findOne').mockResolvedValue({
        id: 'bkg-1',
        customerId: 'customer-1',
        startTime: nearFuture,
        status: BookingStatus.CONFIRMED,
        billiardTable: { status: TableStatus.AVAILABLE },
      } as any);

      await expect(
        bookingsService.cancel('bkg-1', { reason: 'Bận đột xuất' }, {
          id: 'customer-1',
          role: Role.CUSTOMER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('Khách hàng được phép tự hủy khi thời gian bắt đầu còn hơn 60 phút', async () => {
      const now = new Date();
      const farFuture = new Date(now.getTime() + 180 * 60 * 1000); // 3 tiếng sau

      jest.spyOn(bookingsService, 'findOne').mockResolvedValue({
        id: 'bkg-2',
        customerId: 'customer-1',
        startTime: farFuture,
        status: BookingStatus.CONFIRMED,
        billiardTable: { status: TableStatus.AVAILABLE },
      } as any);

      prisma.booking.update.mockResolvedValue({
        id: 'bkg-2',
        status: BookingStatus.CANCELLED,
      });

      const result = await bookingsService.cancel('bkg-2', { reason: 'Thay đổi kế hoạch' }, {
        id: 'customer-1',
        role: Role.CUSTOMER,
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });
});

