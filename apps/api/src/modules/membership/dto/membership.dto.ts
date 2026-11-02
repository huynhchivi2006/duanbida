import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTierBenefitDto {
  @ApiProperty({ example: 'Hạng Bạc (Silver)', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 2000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSpending?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTablePercent?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountServicePercent?: number;

  @ApiProperty({ example: 1.2, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pointMultiplier?: number;

  @ApiProperty({ example: 'Giảm 5% tiền giờ và F&B', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRewardGiftDto {
  @ApiProperty({ example: '01 Giờ chơi Bi-da Miễn Phí' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  pointsRequired: number;

  @ApiProperty({ example: 'Đổi lấy 1 giờ chơi bida miễn phí', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class RedeemGiftDto {
  @ApiProperty({ example: 'gift-uuid' })
  @IsNotEmpty()
  @IsString()
  giftId: string;

  @ApiProperty({ example: 'Nhận tại quầy', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

