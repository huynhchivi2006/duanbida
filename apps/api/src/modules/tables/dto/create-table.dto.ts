import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Area, TableStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTableDto {
  @ApiProperty({ example: 'B09', description: 'Mã số bàn (duy nhất)' })
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @ApiProperty({ example: 'b5a03e1e-2895-46aa-b2b9-6c39f1c07090', description: 'ID loại bàn' })
  @IsUUID()
  @IsNotEmpty()
  tableTypeId: string;

  @ApiProperty({ enum: Area, default: Area.STANDARD })
  @IsEnum(Area)
  @IsOptional()
  area?: Area;

  @ApiProperty({ example: 100000, description: 'Giá theo giờ riêng của bàn này (nếu có, đè lên giá loại bàn)', required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ example: 'Bàn cạnh cửa sổ thoáng đãng', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTableDto {
  @ApiProperty({ example: 'B09-VIP', required: false })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  tableTypeId?: string;

  @ApiProperty({ enum: Area, required: false })
  @IsOptional()
  @IsEnum(Area)
  area?: Area;

  @ApiProperty({ example: 120000, description: 'Giá theo giờ riêng của bàn này (nếu có)', required: false })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateTableStatusDto {
  @ApiProperty({ enum: TableStatus })
  @IsEnum(TableStatus)
  status: TableStatus;
}

export class FindAvailableTablesDto {
  @ApiProperty({ example: '2026-10-27T14:00:00Z', description: 'Thời gian bắt đầu (ISO 8601 UTC)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 120, description: 'Thời lượng chơi (phút)', default: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(360)
  durationMinutes: number;

  @ApiProperty({ required: false, description: 'Lọc theo ID loại bàn' })
  @IsOptional()
  @IsUUID()
  tableTypeId?: string;

  @ApiProperty({ enum: Area, required: false, description: 'Lọc theo khu vực' })
  @IsOptional()
  @IsEnum(Area)
  area?: Area;
}

export class SwitchTableDto {
  @ApiProperty({ example: 'billiard-table-id-or-number', description: 'Bàn đang chơi muốn chuyển đi' })
  @IsNotEmpty()
  @IsString()
  sourceTableId: string;

  @ApiProperty({ example: 'target-table-id-or-number', description: 'Bàn trống muốn chuyển đến' })
  @IsNotEmpty()
  @IsString()
  targetTableId: string;

  @ApiProperty({ example: 'Khách yêu cầu đổi vị trí', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class MergeTablesDto {
  @ApiProperty({ example: 'billiard-table-id-or-number', description: 'Bàn nguồn (sẽ kết thúc và gộp hóa đơn sang bàn đích)' })
  @IsNotEmpty()
  @IsString()
  sourceTableId: string;

  @ApiProperty({ example: 'target-table-id-or-number', description: 'Bàn đích (nhận hóa đơn gộp và tiếp tục)' })
  @IsNotEmpty()
  @IsString()
  targetTableId: string;

  @ApiProperty({ example: 'Nhóm bạn ngồi chung 2 bàn gộp tính tiền chung', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}


