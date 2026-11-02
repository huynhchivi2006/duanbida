import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, CancelBookingDto, FilterBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Bookings - Quản lý Đặt bàn')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Danh sách đặt bàn (Admin & Staff có lọc và tìm kiếm)' })
  findAll(@Query() filter: FilterBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.findAll(filter, user.role, user.id);
  }

  @Get('my')
  @Roles(Role.CUSTOMER, Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Xem lịch sử đặt bàn của cá nhân khách hàng đang đăng nhập' })
  findMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.findMyBookings(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đặt bàn theo ID hoặc Booking Code' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo đặt bàn mới (áp dụng transaction an toàn & chống trùng lịch)' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.create(dto, user);
  }

  @Put(':id/confirm')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Nhân viên/Admin duyệt đơn đặt bàn' })
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.confirm(id, user);
  }

  @Put(':id/check-in')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Xác nhận khách đã đến bàn (Check-in)' })
  checkIn(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.checkIn(id, user);
  }

  @Put(':id/start-session')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Bắt đầu lượt chơi (mở bàn, bắt đầu tính giờ)' })
  startSession(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingsService.startSession(id, user);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Hủy đặt bàn (Khách hàng hủy trước 60p, Nhân viên hủy có lý do)' })
  cancel(@Param('id') id: string, @Body() dto: CancelBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.cancel(id, dto, user);
  }
}

