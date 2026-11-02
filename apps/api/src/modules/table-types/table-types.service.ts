import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableTypeDto, UpdateTableTypeDto } from './dto/create-table-type.dto';

@Injectable()
export class TableTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tableType.findMany({
      orderBy: { hourlyRate: 'asc' },
      include: {
        _count: {
          select: { tables: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const tableType = await this.prisma.tableType.findUnique({
      where: { id },
      include: {
        tables: true,
      },
    });

    if (!tableType) {
      throw new NotFoundException('Không tìm thấy loại bàn bi-da');
    }

    return tableType;
  }

  async create(dto: CreateTableTypeDto) {
    const existing = await this.prisma.tableType.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Mã loại bàn này đã tồn tại');
    }

    return this.prisma.tableType.create({
      data: {
        code: dto.code,
        name: dto.name,
        hourlyRate: dto.hourlyRate,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateTableTypeDto) {
    await this.findOne(id);

    return this.prisma.tableType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const tableType = await this.findOne(id);
    if (tableType.tables && tableType.tables.length > 0) {
      throw new BadRequestException('Không thể xóa loại bàn này vì đang có bàn vật lý liên kết. Hãy xóa các bàn trước.');
    }

    return this.prisma.tableType.delete({
      where: { id },
    });
  }
}

