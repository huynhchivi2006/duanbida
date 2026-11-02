import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipTier } from '@prisma/client';
import { UpdateTierBenefitDto, CreateRewardGiftDto, RedeemGiftDto } from './dto/membership.dto';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách cấu hình ưu đãi của các hạng thành viên
   */
  async getTierBenefits() {
    return this.prisma.membershipTierBenefit.findMany({
      orderBy: { minSpending: 'asc' },
    });
  }

  /**
   * Cập nhật cấu hình quyền lợi ưu đãi cho từng hạng
   */
  async updateTierBenefit(tier: MembershipTier, dto: UpdateTierBenefitDto) {
    const existing = await this.prisma.membershipTierBenefit.findUnique({
      where: { tier },
    });

    if (!existing) {
      throw new NotFoundException(`Không tìm thấy cấu hình hạng ${tier}`);
    }

    return this.prisma.membershipTierBenefit.update({
      where: { tier },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.minSpending !== undefined ? { minSpending: dto.minSpending } : {}),
        ...(dto.discountTablePercent !== undefined ? { discountTablePercent: dto.discountTablePercent } : {}),
        ...(dto.discountServicePercent !== undefined ? { discountServicePercent: dto.discountServicePercent } : {}),
        ...(dto.pointMultiplier !== undefined ? { pointMultiplier: dto.pointMultiplier } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  /**
   * Lấy danh sách quà đổi điểm (Active hoặc Tất cả)
   */
  async getRewardGifts(activeOnly = false) {
    return this.prisma.rewardGift.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { pointsRequired: 'asc' },
    });
  }

  /**
   * Thêm quà tặng mới vào danh mục đổi điểm
   */
  async createRewardGift(dto: CreateRewardGiftDto) {
    return this.prisma.rewardGift.create({
      data: {
        name: dto.name,
        pointsRequired: dto.pointsRequired,
        description: dto.description,
        stockQuantity: dto.stockQuantity ?? 100,
        imageUrl: dto.imageUrl,
        isActive: true,
      },
    });
  }

  /**
   * Cập nhật thông tin quà đổi điểm
   */
  async updateRewardGift(id: string, dto: Partial<CreateRewardGiftDto>) {
    const existing = await this.prisma.rewardGift.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy quà tặng');
    }

    return this.prisma.rewardGift.update({
      where: { id },
      data: dto as any,
    });
  }

  /**
   * Xóa quà tặng đổi điểm
   */
  async deleteRewardGift(id: string) {
    const existing = await this.prisma.rewardGift.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy quà tặng');
    }

    return this.prisma.rewardGift.delete({ where: { id } });
  }

  /**
   * Khách hàng thực hiện đổi điểm lấy quà
   */
  async redeemGift(userId: string, dto: RedeemGiftDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const gift = await this.prisma.rewardGift.findUnique({ where: { id: dto.giftId } });
    if (!gift || !gift.isActive) {
      throw new NotFoundException('Quà tặng không tồn tại hoặc đã ngừng áp dụng');
    }

    if (gift.stockQuantity <= 0) {
      throw new BadRequestException('Quà tặng này hiện tại đã hết số lượng tồn kho');
    }

    if (user.points < gift.pointsRequired) {
      throw new BadRequestException(
        `Bạn hiện có ${user.points} điểm, cần ${gift.pointsRequired} điểm để đổi quà này (còn thiếu ${gift.pointsRequired - user.points} điểm)`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Trừ điểm người dùng
      await tx.user.update({
        where: { id: userId },
        data: {
          points: { decrement: gift.pointsRequired },
        },
      });

      // 2. Giảm số lượng tồn kho
      await tx.rewardGift.update({
        where: { id: gift.id },
        data: {
          stockQuantity: { decrement: 1 },
        },
      });

      // 3. Tạo bản ghi đổi thưởng
      return tx.rewardRedemption.create({
        data: {
          userId,
          giftId: gift.id,
          pointsSpent: gift.pointsRequired,
          status: 'PENDING',
          note: dto.note || 'Yêu cầu đổi quà từ ứng dụng',
        },
        include: {
          gift: true,
        },
      });
    });
  }

  /**
   * Lấy lịch sử đổi quà của khách hàng hiện tại
   */
  async getMyRedemptions(userId: string) {
    return this.prisma.rewardRedemption.findMany({
      where: { userId },
      include: {
        gift: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lấy toàn bộ lịch sử đổi quà (Admin & Thu ngân quản lý trao quà)
   */
  async getAllRedemptions() {
    return this.prisma.rewardRedemption.findMany({
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        gift: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cập nhật trạng thái đổi quà (ví dụ CLAIMED - Đã trao quà cho khách)
   */
  async updateRedemptionStatus(id: string, status: string) {
    const existing = await this.prisma.rewardRedemption.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy yêu cầu đổi quà');
    }

    return this.prisma.rewardRedemption.update({
      where: { id },
      data: { status },
      include: { gift: true },
    });
  }

  /**
   * Lấy tổng quan thẻ thành viên và tiến trình thăng hạng của khách hàng
   */
  async getMyMembershipInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        membershipTier: true,
        points: true,
        totalSpending: true,
        visitCount: true,
        dateOfBirth: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const allBenefits = await this.prisma.membershipTierBenefit.findMany({
      orderBy: { minSpending: 'asc' },
    });

    const currentBenefit = allBenefits.find((b) => b.tier === user.membershipTier) || {
      tier: user.membershipTier,
      name: `Hạng ${user.membershipTier}`,
      minSpending: 0,
      discountTablePercent: 0,
      discountServicePercent: 0,
      pointMultiplier: 1.0,
      description: '',
    };

    // Tìm hạng kế tiếp
    const currentMinSpend = Number(currentBenefit.minSpending);
    const nextBenefit = allBenefits.find((b) => Number(b.minSpending) > currentMinSpend);

    let progressToNextTier = 100;
    let spendNeededForNextTier = 0;

    const totalSpendingNum = Number(user.totalSpending);

    if (nextBenefit) {
      const nextMinSpend = Number(nextBenefit.minSpending);
      spendNeededForNextTier = Math.max(0, nextMinSpend - totalSpendingNum);
      const denominator = nextMinSpend - currentMinSpend;
      progressToNextTier = denominator > 0
        ? Math.min(100, Math.max(0, Math.round(((totalSpendingNum - currentMinSpend) / denominator) * 100)))
        : 100;
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        membershipTier: user.membershipTier,
        points: user.points,
        totalSpending: totalSpendingNum,
        visitCount: user.visitCount,
      },
      currentTierBenefit: {
        ...currentBenefit,
        minSpending: Number(currentBenefit.minSpending),
        discountTablePercent: Number(currentBenefit.discountTablePercent),
        discountServicePercent: Number(currentBenefit.discountServicePercent),
        pointMultiplier: Number(currentBenefit.pointMultiplier),
      },
      nextTierBenefit: nextBenefit
        ? {
            ...nextBenefit,
            minSpending: Number(nextBenefit.minSpending),
            discountTablePercent: Number(nextBenefit.discountTablePercent),
            discountServicePercent: Number(nextBenefit.discountServicePercent),
            pointMultiplier: Number(nextBenefit.pointMultiplier),
          }
        : null,
      progressToNextTier,
      spendNeededForNextTier,
    };
  }
}

