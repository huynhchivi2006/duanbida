import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import {
  CreateTableDto,
  UpdateTableDto,
  UpdateTableStatusDto,
  FindAvailableTablesDto,
  SwitchTableDto,
  MergeTablesDto,
} from './dto/create-table.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, TableStatus, Area } from '@prisma/client';

@ApiTags('Tables - Danh sách & Bàn bi-da')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post('switch')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Chuyển bàn khi khách có nhu cầu đổi vị trí' })
  switchTable(@Body() dto: SwitchTableDto, @Request() req: any) {
    return this.tablesService.switchTable(dto, req.user);
  }

  @Post('merge')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Gộp 2 bàn khi khách có nhu cầu gộp hóa đơn chung' })
  mergeTables(@Body() dto: MergeTablesDto, @Request() req: any) {
    return this.tablesService.mergeTables(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách tất cả các bàn bi-da (kèm trạng thái hiện tại)' })
  @ApiQuery({ name: 'status', enum: TableStatus, required: false })
  @ApiQuery({ name: 'area', enum: Area, required: false })
  @ApiQuery({ name: 'tableTypeId', required: false })
  findAll(
    @Query('status') status?: TableStatus,
    @Query('area') area?: Area,
    @Query('tableTypeId') tableTypeId?: string,
  ) {
    return this.tablesService.findAll(status, area, tableTypeId);
  }

  @Get('available')
  @ApiOperation({ summary: 'Tìm kiếm bàn trống khả dụng theo ngày, giờ và thời lượng' })
  findAvailable(@Query() query: FindAvailableTablesDto) {
    return this.tablesService.findAvailable(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bàn bi-da' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin thêm bàn mới' })
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin cập nhật thông tin bàn' })
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Put(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật trạng thái bàn (AVAILABLE, OCCUPIED, MAINTENANCE)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTableStatusDto) {
    return this.tablesService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin xóa bàn' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}

