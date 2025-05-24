import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Corrected path
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'; // Import Swagger decorators

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
}
