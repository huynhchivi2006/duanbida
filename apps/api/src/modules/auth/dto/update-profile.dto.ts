import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Nguyễn Văn Bình', description: 'Họ và tên mới', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: '0988776655', description: 'Số điện thoại', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '1995-08-15', description: 'Ngày sinh (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

