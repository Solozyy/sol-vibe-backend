import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';

@ApiTags('Memberships')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a creator' })
  @ApiResponse({ status: 201, description: 'Successfully subscribed.' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., subscribing to self, invalid ID).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Creator user not found.' })
  @ApiResponse({ status: 409, description: 'Already subscribed.' })
  async subscribe(@Req() req, @Body() subscribeDto: SubscribeDto) {
    const subscriberUserId = req.user.userId;
    if (!Types.ObjectId.isValid(subscribeDto.creatorUserId)) {
      throw new BadRequestException('Invalid creatorUserId format.');
    }
    return this.membershipsService.subscribe(subscriberUserId, subscribeDto);
  }
}
