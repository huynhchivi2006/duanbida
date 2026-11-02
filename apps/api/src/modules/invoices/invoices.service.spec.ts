import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingRulesService } from '../pricing-rules/pricing-rules.service';
import { ConflictException } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

describe('InvoicesService (Unit Tests: Pricing & Payment)', () => {
  let invoicesService: InvoicesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      invoice: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      invoiceItem: {
        create: jest.fn(),
      },
      playSession: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      billiardTable: {
        update: jest.fn(),
      },
      booking: {
        update: jest.fn(),
      },
      bookingStatusHistory: {
        create: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const mockPricingRulesService = {
      getActiveRuleForDate: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
        { provide: PricingRulesService, useValue: mockPricingRulesService },
      ],
    }).compile();

    invoicesService = module.get<InvoicesService>(InvoicesService);
  });

  describe('Chống thanh toán hai lần (Anti Double-Payment)', () => {
    it('Từ chối thanh toán (409 Conflict) nếu hóa đơn đã ở trạng thái PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        invoiceCode: 'INV-20261026-0001',
        status: InvoiceStatus.PAID,
        finalAmount: 150000,
      });

      await expect(
        invoicesService.pay(
          'inv-1',
          { method: PaymentMethod.CASH },
          { id: 'staff-1' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('Xác nhận thanh toán thành công cho hóa đơn UNPAID và cập nhật trạng thái', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-2',
        invoiceCode: 'INV-20261026-0002',
        status: InvoiceStatus.UNPAID,
        finalAmount: 200000,
        bookingId: 'booking-2',
        playSession: { billiardTableId: 'table-2' },
      });

      prisma.invoice.update.mockResolvedValue({
        id: 'inv-2',
        status: InvoiceStatus.PAID,
      });

      const result = await invoicesService.pay(
        'inv-2',
        { method: PaymentMethod.BANK_TRANSFER, transactionRef: 'QR-999' },
        { id: 'staff-1' },
      );

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.billiardTable.update).toHaveBeenCalledWith({
        where: { id: 'table-2' },
        data: { status: 'AVAILABLE' },
      });
    });
  });
});

