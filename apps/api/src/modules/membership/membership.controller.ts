import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { UpdateTierBenefitDto, CreateRewardGiftDto, RedeemGiftDto } from './dto/membership.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, MembershipTier } from '@prisma/client';

@ApiTags('Membership - Hội viên & Tích điểm đổi quà')
@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('tiers')
  @ApiOperation({ summary: 'Xem danh sách các hạng thành viên và cấu hình ưu đãi' })
  getTierBenefits() {
    return this.membershipService.getTierBenefits();
  }

  @Put('tiers/:tier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật ưu đãi phân hạng thành viên' })
  updateTierBenefit(
    @Param('tier') tier: MembershipTier,
    @Body() dto: UpdateTierBenefitDto,
  ) {
    return this.membershipService.updateTierBenefit(tier, dto);
  }

  @Get('gifts')
  @ApiOperation({ summary: 'Xem danh mục quà tặng đổi điểm' })
  getRewardGifts() {
    return this.membershipService.getRewardGifts(false);
  }

  @Post('gifts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin tạo quà tặng mới' })
  createRewardGift(@Body() dto: CreateRewardGiftDto) {
    return this.membershipService.createRewardGift(dto);
  }

  @Put('gifts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin cập nhật quà tặng' })
  updateRewardGift(@Param('id') id: string, @Body() dto: Partial<CreateRewardGiftDto>) {
    return this.membershipService.updateRewardGift(id, dto);
  }

  @Delete('gifts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin xóa quà tặng' })
  deleteRewardGift(@Param('id') id: string) {
    return this.membershipService.deleteRewardGift(id);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khách hàng đổi điểm tích lũy lấy quà' })
  redeemGift(@Request() req: any, @Body() dto: RedeemGiftDto) {
    return this.membershipService.redeemGift(req.user.id, dto);
  }

  @Get('my-redemptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lịch sử đổi quà của khách hàng hiện tại' })
  getMyRedemptions(@Request() req: any) {
    return this.membershipService.getMyRedemptions(req.user.id);
  }

  @Get('my-card')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem thông tin thẻ thành viên điện tử (Silver, Gold, VIP)' })
  getMyMembershipInfo(@Request() req: any) {
    return this.membershipService.getMyMembershipInfo(req.user.id);
  }

  @Get('redemptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin & Thu ngân xem tất cả yêu cầu đổi quà' })
  getAllRedemptions() {
    return this.membershipService.getAllRedemptions();
  }

  @Put('redemptions/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái đổi quà (CLAIMED / CANCELLED)' })
  updateRedemptionStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.membershipService.updateRedemptionStatus(id, status);
  }
}

