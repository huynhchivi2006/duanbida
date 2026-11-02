import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePricingRuleDto, UpdatePricingRuleDto, RuleType } from './dto/pricing-rule.dto';

@Injectable()
export class PricingRulesService {
  private readonly logger = new Logger(PricingRulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyActive = false) {
    const where: any = {};
    if (onlyActive) where.isActive = true;

    return this.prisma.pricingRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.pricingRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Không tìm thấy quy tắc phụ thu');
    }

    return rule;
  }

  async create(dto: CreatePricingRuleDto) {
    return this.prisma.pricingRule.create({
      data: {
        name: dto.name,
        ruleType: dto.ruleType,
        dayOfWeek: dto.dayOfWeek,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        surchargePercent: dto.surchargePercent ?? 20,
        fixedSurcharge: dto.fixedSurcharge ?? 0,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePricingRuleDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    return this.prisma.pricingRule.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.pricingRule.delete({
      where: { id },
    });
  }

  /**
   * Kiểm tra ngày giờ hiện tại có áp dụng quy tắc phụ thu (Chủ Nhật, Cuối tuần, Ngày Lễ/Tết) nào không
   */
  async getActiveRuleForDate(date: Date = new Date()) {
    const activeRules = await this.prisma.pricingRule.findMany({
      where: { isActive: true },
    });

    const dayOfWeek = date.getDay(); // 0: Chủ Nhật, 6: Thứ Bảy

    for (const rule of activeRules) {
      // 1. Kiểm tra ngày lễ / Tết theo khoảng ngày
      if ((rule.ruleType === RuleType.HOLIDAY || rule.ruleType === RuleType.SPECIAL_DATE) && rule.startDate && rule.endDate) {
        const start = new Date(rule.startDate).getTime();
        const end = new Date(rule.endDate).getTime();
        const current = date.getTime();
        if (current >= start && current <= end) {
          return rule;
        }
      }

      // 2. Kiểm tra Chủ Nhật
      if (rule.ruleType === RuleType.SUNDAY_ONLY && dayOfWeek === 0) {
        return rule;
      }

      // 3. Kiểm tra Cuối tuần (Thứ 7 hoặc Chủ Nhật)
      if (rule.ruleType === RuleType.WEEKEND && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return rule;
      }

      // 4. Kiểm tra theo ngày cụ thể trong tuần (nếu được cấu hình)
      if (rule.dayOfWeek !== null && rule.dayOfWeek !== undefined && rule.dayOfWeek === dayOfWeek) {
        return rule;
      }
    }

    return null;
  }
}

