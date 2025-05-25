import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Optional,
  Query,
  ParseUUIDPipe,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PostAccessLevel } from './schemas/post.schema';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createPostDto: CreatePostDto, @Req() req) {
    const userId = req.user.userId;
    const userWalletAddress = req.user.walletAddress;
    return this.postsService.create(createPostDto, userId, userWalletAddress);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts (public and member-only if subscribed)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved posts.' })
  @ApiQuery({ name: 'accessLevel', enum: PostAccessLevel, required: false, description: 'Filter by access level (for admins or specific views, not typically for general users)' })
  findAll(@Req() req, @Optional() @Query('accessLevel') accessLevel?: PostAccessLevel) {
    const requestingUserId = req.user?.userId;
    return this.postsService.findAll(requestingUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved post.' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g., trying to access members-only post).' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @ApiParam({ name: 'id', description: 'ID of the post', type: String })
  async findOne(@Param('id') id: string, @Req() req) {
    const requestingUserId = req.user?.userId;
    try {
      return await this.postsService.findOne(id, requestingUserId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
