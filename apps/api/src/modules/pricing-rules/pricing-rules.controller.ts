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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PricingRulesService } from './pricing-rules.service';
import { CreatePricingRuleDto, UpdatePricingRuleDto } from './dto/pricing-rule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Bảng giá & Phụ thu Ngày Lễ/Chủ Nhật (Pricing Rules)')
@Controller('pricing-rules')
export class PricingRulesController {
  constructor(private readonly pricingRulesService: PricingRulesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các quy tắc phụ thu ngày lễ, chủ nhật' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  findAll(@Query('onlyActive') onlyActive?: string) {
    return this.pricingRulesService.findAll(onlyActive === 'true');
  }

  @Get('active-today')
  @ApiOperation({ summary: 'Kiểm tra quy tắc phụ thu đang áp dụng cho hôm nay' })
  getActiveToday() {
    return this.pricingRulesService.getActiveRuleForDate(new Date());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 quy tắc phụ thu' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pricingRulesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Tạo quy tắc phụ thu mới (Chủ nhật, ngày lễ Tết...)' })
  create(@Body() dto: CreatePricingRuleDto) {
    return this.pricingRulesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Cập nhật quy tắc phụ thu' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePricingRuleDto) {
    return this.pricingRulesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Xóa quy tắc phụ thu' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pricingRulesService.remove(id);
  }
}

