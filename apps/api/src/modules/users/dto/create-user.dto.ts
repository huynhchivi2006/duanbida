import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'staff2@billiards.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Staff@123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Lê Hoàng Long' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0933445566', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: Role, default: Role.STAFF })
  @IsEnum(Role)
  role: Role;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus;
}

