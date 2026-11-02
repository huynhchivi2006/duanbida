import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateInvoiceFromSessionDto {
  @ApiProperty({ example: 'uuid-phien-choi', description: 'ID phiên chơi hoặc ID bàn cần thanh toán kết thúc' })
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @ApiProperty({
    example: 'BLOCK_5',
    enum: ['BLOCK_5', 'BLOCK_15', 'EXACT'],
    required: false,
    description: 'Chế độ tính tiền làm tròn: BLOCK_5 (5 phút), BLOCK_15 (15 phút), EXACT (theo phút thực tế)',
  })
  @IsOptional()
  @IsString()
  roundingMode?: 'BLOCK_5' | 'BLOCK_15' | 'EXACT';

  @ApiProperty({ example: 'CHAOMUNG20', required: false, description: 'Mã voucher giảm giá' })
  @IsOptional()
  @IsString()
  voucherCode?: string;

  @ApiProperty({ example: '0901234567', required: false, description: 'Số điện thoại khách hàng' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ example: 'uuid-khach-hang', required: false, description: 'ID khách hàng' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: 0, required: false, description: 'Số tiền giảm giá (chiết khấu thủ công)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiProperty({ example: 'Khách hàng thân thiết', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AddInvoiceServiceItemDto {
  @ApiProperty({ example: 'uuid-mon-dich-vu', description: 'ID món trong menu dịch vụ' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 2, description: 'Số lượng món' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class PayInvoiceDto {
  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.CASH, description: 'Phương thức thanh toán' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 'MB-TRANS-987654', required: false, description: 'Mã tham chiếu ngân hàng/ví điện tử' })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiProperty({ example: 'Đã nhận đủ tiền', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class AddSessionOrderDto {
  @ApiProperty({ example: 'uuid-mon-dich-vu', description: 'ID món trong menu dịch vụ' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 1, description: 'Số lượng món' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class AssignStaffServiceDto {
  @ApiProperty({ example: 'uuid-nhan-vien', description: 'ID nhân viên phục vụ' })
  @IsUUID()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ example: 'BALL_RACKER', enum: ['BALL_RACKER', 'TABLE_ATTENDANT'], description: 'Loại hình phục vụ (xếp bi hoặc đứng bàn)' })
  @IsString()
  @IsNotEmpty()
  roleType: 'BALL_RACKER' | 'TABLE_ATTENDANT';

  @ApiProperty({ example: 30000, required: false, description: 'Phí dịch vụ nhân viên (VNĐ)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiProperty({ example: 'Hỗ trợ khách trong suốt trận đấu', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}


