import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserStatusDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, MembershipTier } from '@prisma/client';

@ApiTags('Users - Quản lý người dùng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Danh sách người dùng (Admin & Staff)' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'tier', enum: MembershipTier, required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('role') role?: Role,
    @Query('tier') tier?: MembershipTier,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(role, search, tier);
  }

  @Get('by-phone/:phone')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Tra cứu khách hàng nhanh theo SĐT (Thu ngân / POS)' })
  findByPhone(@Param('phone') phone: string) {
    return this.usersService.findByPhone(phone);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Chi tiết người dùng' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin tạo tài khoản nhân viên / khách hàng mới' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin cập nhật trạng thái tài khoản (ACTIVE, INACTIVE, BLOCKED)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto);
  }
}

