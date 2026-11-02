import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = false) {
    return this.prisma.voucher.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: {
        OR: [{ id }, { code: { equals: id, mode: 'insensitive' } }],
      },
    });

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy mã giảm giá');
    }

    return voucher;
  }

  async create(dto: CreateVoucherDto) {
    const existing = await this.prisma.voucher.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Mã voucher "${dto.code}" đã tồn tại`);
    }

    return this.prisma.voucher.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderValue: dto.minOrderValue ?? 0,
        maxDiscount: dto.maxDiscount,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        usageLimit: dto.usageLimit,
        applicableTo: dto.applicableTo || 'ALL',
        description: dto.description,
        isActive: true,
      },
    });
  }

  async update(id: string, dto: UpdateVoucherDto) {
    await this.findOne(id);

    return this.prisma.voucher.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.discountType ? { discountType: dto.discountType } : {}),
        ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
        ...(dto.minOrderValue !== undefined ? { minOrderValue: dto.minOrderValue } : {}),
        ...(dto.maxDiscount !== undefined ? { maxDiscount: dto.maxDiscount } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate ? new Date(dto.startDate) : null } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.applicableTo ? { applicableTo: dto.applicableTo } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.voucher.delete({ where: { id } });
  }

  /**
   * Kiểm tra và tính số tiền giảm giá từ voucher
   */
  async validateVoucher(code: string, orderValue: number, targetType = 'ALL') {
    const voucher = await this.prisma.voucher.findFirst({
      where: {
        code: { equals: code.trim(), mode: 'insensitive' },
      },
    });

    if (!voucher) {
      throw new NotFoundException(`Mã giảm giá "${code}" không tồn tại`);
    }

    if (!voucher.isActive) {
      throw new BadRequestException(`Mã giảm giá "${code}" đang tạm dừng hoặc đã hết hiệu lực`);
    }

    const now = new Date();
    if (voucher.startDate && now < voucher.startDate) {
      throw new BadRequestException(`Mã giảm giá "${code}" chưa đến thời gian áp dụng`);
    }

    if (voucher.endDate && now > voucher.endDate) {
      throw new BadRequestException(`Mã giảm giá "${code}" đã hết hạn sử dụng`);
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException(`Mã giảm giá "${code}" đã hết lượt sử dụng`);
    }

    const minVal = Number(voucher.minOrderValue);
    if (orderValue < minVal) {
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu ${minVal.toLocaleString('vi-VN')}đ để dùng mã này`
      );
    }

    // Tính số tiền giảm
    let discountAmount = 0;
    const discVal = Number(voucher.discountValue);

    if (voucher.discountType === 'PERCENT') {
      discountAmount = Math.round((orderValue * discVal) / 100);
      if (voucher.maxDiscount) {
        const maxDisc = Number(voucher.maxDiscount);
        discountAmount = Math.min(discountAmount, maxDisc);
      }
    } else {
      discountAmount = Math.min(orderValue, discVal);
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: discVal,
        maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
      },
      discountAmount,
      finalEstimated: Math.max(0, orderValue - discountAmount),
      message: `Áp dụng thành công mã ${voucher.code}: Giảm ${discountAmount.toLocaleString('vi-VN')}đ`,
    };
  }
}

