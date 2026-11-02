import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: '32e7c37e-6f81-42cb-bfa2-f38b1897d2ba', description: 'ID của bàn bi-da' })
  @IsUUID()
  @IsNotEmpty()
  billiardTableId: string;

  @ApiProperty({ example: '2026-10-27T15:00:00Z', description: 'Thời gian bắt đầu (UTC ISO-8601)' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: 120, description: 'Thời lượng đặt bàn tính bằng phút (tối thiểu 60, tối đa 360)' })
  @Type(() => Number)
  @IsInt()
  @Min(30, { message: 'Thời lượng chơi tối thiểu là 30 phút' })
  @Max(360, { message: 'Thời lượng chơi tối đa mỗi lần đặt là 360 phút (6 tiếng)' })
  durationMinutes: number;

  @ApiProperty({ example: 'Đặt bàn giao lưu câu lạc bộ', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: [{ serviceId: 'uuid-mon-an', quantity: 2 }],
    required: false,
    description: 'Danh sách đồ uống/món ăn khách chọn trước khi đặt bàn',
  })
  @IsOptional()
  preOrderedServices?: Array<{ serviceId: string; quantity: number }>;

  @ApiProperty({
    example: 'BALL_RACKER',
    required: false,
    description: 'Yêu cầu nhân viên phục vụ: BALL_RACKER (Xếp bi 30k) hoặc TABLE_ATTENDANT (Trợ lý bàn 50k)',
  })
  @IsOptional()
  @IsString()
  requestedStaffRole?: string;

  @ApiProperty({
    example: 'uuid-nhan-vien',
    required: false,
    description: 'ID nhân viên phục vụ được khách chỉ định cụ thể (tùy chọn)',
  })
  @IsOptional()
  @IsString()
  requestedStaffId?: string;

  @ApiProperty({ example: 'uuid-khach-hang', required: false, description: 'Chỉ dành cho Nhân viên tạo đơn hộ khách tại quầy' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class CancelBookingDto {
  @ApiProperty({ example: 'Có việc bận đột xuất', description: 'Lý do hủy đặt bàn' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng cung cấp lý do hủy đặt bàn' })
  reason: string;
}

export class FilterBookingDto {
  @ApiProperty({ required: false, description: 'Lọc theo trạng thái đặt bàn' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Lọc theo ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ required: false, description: 'Lọc theo ID bàn' })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiProperty({ required: false, description: 'Tìm kiếm theo mã đặt bàn, tên khách, SĐT' })
  @IsOptional()
  @IsString()
  search?: string;
}

