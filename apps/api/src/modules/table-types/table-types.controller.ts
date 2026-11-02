import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TableTypesService } from './table-types.service';
import { CreateTableTypeDto, UpdateTableTypeDto } from './dto/create-table-type.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Table Types - Loại bàn & Bảng giá')
@Controller('table-types')
export class TableTypesController {
  constructor(private readonly tableTypesService: TableTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách các loại bàn và bảng giá (Công khai)' })
  findAll() {
    return this.tableTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết loại bàn (Công khai)' })
  findOne(@Param('id') id: string) {
    return this.tableTypesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin thêm loại bàn mới' })
  create(@Body() dto: CreateTableTypeDto) {
    return this.tableTypesService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin cập nhật thông tin loại bàn & giá thuê' })
  update(@Param('id') id: string, @Body() dto: UpdateTableTypeDto) {
    return this.tableTypesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin xóa loại bàn' })
  remove(@Param('id') id: string) {
    return this.tableTypesService.remove(id);
  }
}

