import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, Min, IsBoolean } from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreateVoucherDto {
  @ApiProperty({ example: 'ROYAL50K' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Voucher giảm 50k cho đơn từ 150k' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: DiscountType, default: DiscountType.PERCENT })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 20, description: '20% hoặc 50000 VNĐ' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ example: 100000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z', required: false })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ example: 'ALL', description: 'ALL, TABLE_ONLY, SERVICE_ONLY', required: false })
  @IsOptional()
  @IsString()
  applicableTo?: string;

  @ApiProperty({ example: 'Áp dụng cho mọi dịch vụ', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateVoucherDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: DiscountType, required: false })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  applicableTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ValidateVoucherDto {
  @ApiProperty({ example: 'ROYAL50K' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 200000 })
  @IsNotEmpty()
  @IsNumber()
  orderValue: number;

  @ApiProperty({ example: 'ALL', required: false })
  @IsOptional()
  @IsString()
  targetType?: string;
}

