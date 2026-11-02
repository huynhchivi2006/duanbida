import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Vouchers - Quản lý Voucher & Khuyến mãi')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách Voucher khả dụng' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.vouchersService.findAll(activeOnly === 'true');
  }

  @Get('validate')
  @ApiOperation({ summary: 'Kiểm tra và tính giảm giá của mã Voucher' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'orderValue', required: true, type: Number })
  @ApiQuery({ name: 'targetType', required: false })
  validate(
    @Query('code') code: string,
    @Query('orderValue') orderValue: number,
    @Query('targetType') targetType?: string,
  ) {
    return this.vouchersService.validateVoucher(code, Number(orderValue), targetType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một Voucher' })
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin tạo Voucher mới' })
  create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật Voucher' })
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.vouchersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin xóa Voucher' })
  remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }
}

