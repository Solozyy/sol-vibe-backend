import { Controller, Post, Body, UseGuards, Req, Get, Param, Query, ParseIntPipe, DefaultValuePipe, BadRequestException } from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Corrected path
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'; // Import Swagger decorators
import { VoteStatsQueryDto } from './dto/vote-stats-query.dto'; // Import DTO
import { UserVoteSummaryQueryDto } from './dto/user-vote-summary-query.dto'; // Import new DTO
import { Types } from 'mongoose'; // Import Types for ObjectId validation (optional but good practice)

@ApiTags('Votes') // Group APIs under 'Votes' tag in Swagger UI
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @ApiOperation({ summary: 'Create or update a vote' })
  @ApiResponse({ status: 201, description: 'Vote created/updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @ApiBearerAuth() // Indicate that this endpoint requires Bearer token authentication
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createVoteDto: CreateVoteDto, @Req() req) {
    const userId = req.user.userId; // Changed from req.user.sub to req.user.userId
    return this.votesService.create(createVoteDto, userId);
  }

  @ApiOperation({ summary: 'Get all votes for a specific post' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved votes for the post.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @ApiParam({ name: 'postId', description: 'ID of the post', type: String })
  @Get('post/:postId')
  getVotesForPost(@Param('postId') postId: string) {
    return this.votesService.getVotesForPost(postId);
  }

  // Optional: Get votes by a specific user
  @ApiOperation({ summary: 'Get all votes by the current authenticated user' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved votes by the user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user')
  getVotesByUser(@Req() req) {
    const userId = req.user.userId; // Changed from req.user.sub to req.user.userId
    return this.votesService.getVotesByUser(userId);
  }

  @Get('stats/user-summary/:userId')
  @ApiOperation({ summary: 'Get net vote summary for a specific user within a time range' })
  @ApiParam({ name: 'userId', description: 'ID of the user', type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved user vote summary.' })
  @ApiResponse({ status: 400, description: 'Invalid userId or query parameters.' })
  async getUserVoteSummary(
    @Param('userId') userId: string,
    @Query() queryDto: UserVoteSummaryQueryDto,
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId format');
    }
    return this.votesService.getUserVoteSummary(userId, queryDto);
  }

  @Get('stats/top-net-voters')
  @ApiOperation({ summary: 'Get top K users with the highest net votes within a time range' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top users to return (default: 10, min: 1, max: 100)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved top net voters.' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters.' })
  async getTopNetVoters(@Query() queryDto: VoteStatsQueryDto) {
    return this.votesService.getTopNetVoters(queryDto);
  }
}
