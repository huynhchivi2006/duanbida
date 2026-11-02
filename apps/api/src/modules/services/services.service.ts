import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto';
import { ServiceCategory } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: ServiceCategory, onlyActive = true) {
    const where: any = {};
    if (category) where.category = category;
    if (onlyActive) where.isActive = true;

    return this.prisma.serviceItem.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.serviceItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy món dịch vụ này');
    }

    return item;
  }

  async create(dto: CreateServiceDto) {
    const existing = await this.prisma.serviceItem.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Mã dịch vụ ${dto.code} đã tồn tại`);
    }

    return this.prisma.serviceItem.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);

    return this.prisma.serviceItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete: chuyển isActive sang false
    return this.prisma.serviceItem.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

