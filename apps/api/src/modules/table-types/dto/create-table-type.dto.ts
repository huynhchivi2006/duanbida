import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTableTypeDto {
  @ApiProperty({ example: 'POOL', description: 'Mã loại bàn (duy nhất)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Bàn Bida Lỗ (Pool 9-Ball)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 80000, description: 'Đơn giá thuê theo giờ (VNĐ)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiProperty({ example: 'Bàn thi đấu quốc tế 9ft...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://...', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTableTypeDto {
  @ApiProperty({ example: 'Bàn Bida Lỗ 9ft Nâng Cấp', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 85000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

