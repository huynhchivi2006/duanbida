import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceFromSessionDto,
  AddInvoiceServiceItemDto,
  PayInvoiceDto,
  AddSessionOrderDto,
  AssignStaffServiceDto,
} from './dto/invoice.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices & Payments - Hóa đơn & Thanh toán')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * Endpoint PUBLIC: Khách dùng điện thoại quét mã QR tại bàn để xem tiêu dùng thời gian thực
   */
  @Get('live/:code')
  @ApiOperation({ summary: 'Xem tiêu dùng trực tiếp qua mã QR (Không cần đăng nhập)' })
  getLiveBill(@Param('code') code: string) {
    return this.invoicesService.getLiveBill(code);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Danh sách hóa đơn (Admin & Staff)' })
  @ApiQuery({ name: 'status', enum: InvoiceStatus, required: false })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
  findAll(@Query('status') status?: InvoiceStatus, @Query('date') date?: string) {
    return this.invoicesService.findAll(status, date);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.STAFF, Role.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Lịch sử hóa đơn cá nhân khách hàng' })
  findMyInvoices(@CurrentUser('id') userId: string) {
    return this.invoicesService.findMyInvoices(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Chi tiết hóa đơn theo ID hoặc mã hóa đơn' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post('quick-open/:tableId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Mở bàn nhanh cho khách vãng lai (không cần đặt trước)' })
  quickOpen(
    @Param('tableId') tableId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.invoicesService.quickOpenSession(tableId, currentUser);
  }

  @Post('table/:tableId/order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Gọi thêm đồ uống/dịch vụ theo bàn (tự động tạo phiên nếu chưa có)' })
  addTableOrder(
    @Param('tableId') tableId: string,
    @Body() dto: AddSessionOrderDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.invoicesService.addTableOrder(tableId, dto, currentUser);
  }

  @Post('table/:tableId/assign-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Gán nhân viên phục vụ bàn theo bàn (tự động tạo phiên nếu chưa có)' })
  assignStaffByTable(
    @Param('tableId') tableId: string,
    @Body() dto: AssignStaffServiceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.invoicesService.assignStaffByTable(tableId, dto, currentUser);
  }

  @Post('session/:sessionId/order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Gọi thêm đồ uống/dịch vụ khi bàn đang chơi' })
  addSessionOrder(
    @Param('sessionId') sessionId: string,
    @Body() dto: AddSessionOrderDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.invoicesService.addSessionOrder(sessionId, dto, currentUser);
  }

  @Post('session/:sessionId/assign-staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Gán nhân viên phục vụ bàn (Xếp bi, đứng bàn)' })
  assignStaff(
    @Param('sessionId') sessionId: string,
    @Body() dto: AssignStaffServiceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.invoicesService.assignStaff(sessionId, dto, currentUser);
  }

  @Post('create-from-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Kết thúc lượt chơi, tính tiền giờ và tạo hóa đơn' })
  createFromSession(
    @Body() dto: CreateInvoiceFromSessionDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.invoicesService.createFromSession(dto, currentUser);
  }

  @Post(':id/add-service')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Thêm đồ uống/dịch vụ vào hóa đơn đang mở' })
  addServiceItem(
    @Param('id') id: string,
    @Body() dto: AddInvoiceServiceItemDto,
  ) {
    return this.invoicesService.addServiceItem(id, dto);
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Xác nhận thanh toán hóa đơn (Chống thanh toán 2 lần)' })
  pay(
    @Param('id') id: string,
    @Body() dto: PayInvoiceDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.invoicesService.pay(id, dto, currentUser);
  }
}
