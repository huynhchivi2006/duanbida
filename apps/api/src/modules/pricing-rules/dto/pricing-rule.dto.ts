import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RuleType {
  WEEKEND = 'WEEKEND',
  SUNDAY_ONLY = 'SUNDAY_ONLY',
  HOLIDAY = 'HOLIDAY',
  SPECIAL_DATE = 'SPECIAL_DATE',
}

export class CreatePricingRuleDto {
  @ApiProperty({ description: 'Tên quy tắc phụ thu', example: 'Phụ thu ngày Chủ Nhật' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: RuleType, description: 'Loại quy tắc', example: 'SUNDAY_ONLY' })
  @IsEnum(RuleType)
  ruleType: RuleType;

  @ApiPropertyOptional({ description: 'Ngày trong tuần (0: Chủ Nhật, 6: Thứ Bảy)', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu áp dụng (định dạng ISO)', example: '2026-04-30T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc áp dụng (định dạng ISO)', example: '2026-05-02T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Tỷ lệ % phụ thu trên tiền giờ', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  surchargePercent?: number;

  @ApiPropertyOptional({ description: 'Số tiền phụ thu cố định (VNĐ)', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedSurcharge?: number;

  @ApiPropertyOptional({ description: 'Ghi chú mô tả' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Trạng thái kích hoạt', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: RuleType })
  @IsOptional()
  @IsEnum(RuleType)
  ruleType?: RuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  surchargePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedSurcharge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
