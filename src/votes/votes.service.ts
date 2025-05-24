import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vote, VoteType } from './schemas/vote.schema';
import { CreateVoteDto } from './dto/create-vote.dto';
import { PostsService } from '../posts/posts.service';
import { Post } from '../posts/schemas/post.schema';
import { VoteStatsQueryDto } from './dto/vote-stats-query.dto';
import { UserVoteSummaryQueryDto } from './dto/user-vote-summary-query.dto';

@Injectable()
export class VotesService {
  constructor(
    @InjectModel(Vote.name) private voteModel: Model<Vote>,
    private readonly postsService: PostsService,
  ) {}

  async create(createVoteDto: CreateVoteDto, userId: string) {
    const { postId, type } = createVoteDto;

    const post = await this.postsService.findOne(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingVote = await this.voteModel.findOne({
      post: postId,
      user: userId,
    });

    if (existingVote) {
      if (existingVote.type === type) {
        // User is unvoting
        await this.voteModel.findByIdAndDelete(existingVote._id);
        await this.updatePostVoteCounts(postId, type, -1);
        return { message: 'Vote removed' };
      } else {
        // User is changing vote type
        existingVote.type = type;
        await existingVote.save();
        // Adjust counts: decrement old type, increment new type
        await this.updatePostVoteCounts(postId, type === VoteType.UPVOTE ? VoteType.DOWNVOTE : VoteType.UPVOTE, -1);
        await this.updatePostVoteCounts(postId, type, 1);
        return existingVote;
      }
    } else {
      // New vote
      const newVote = new this.voteModel({
        post: postId,
        user: userId,
        type,
      });
      await newVote.save();
      await this.updatePostVoteCounts(postId, type, 1);
      return newVote;
    }
  }

  private async updatePostVoteCounts(postId: string, voteType: VoteType, increment: 1 | -1) {
    const update = voteType === VoteType.UPVOTE
      ? { $inc: { upvotesCount: increment } }
      : { $inc: { downvotesCount: increment } };
    await this.postsService.update(postId, update as Partial<Post>); // Cast to Partial<Post>
  }

  async getVotesForPost(postId: string) {
    return this.voteModel.find({ post: postId }).exec();
  }

  async getVotesByUser(userId: string) {
    return this.voteModel.find({ user: userId }).exec();
  }

  async getUserVoteSummary(userId: string, queryDto: UserVoteSummaryQueryDto) {
    const { startDate, endDate } = queryDto;
    const matchConditions: any = { user: new Types.ObjectId(userId) };

    if (startDate) {
      matchConditions.createdAt = { ...matchConditions.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      matchConditions.createdAt = { ...matchConditions.createdAt, $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }

    const aggregationResult = await this.voteModel.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          upvotes: { $sum: { $cond: [{ $eq: ['$type', VoteType.UPVOTE] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ['$type', VoteType.DOWNVOTE] }, 1, 0] } },
        },
      },
    ]);

    const stats = aggregationResult[0] || { upvotes: 0, downvotes: 0 };

    return {
      userId,
      startDate: startDate || null,
      endDate: endDate || null,
      upvotes: stats.upvotes,
      downvotes: stats.downvotes,
      netVotes: stats.upvotes - stats.downvotes,
    };
  }

  async getTopNetVoters(queryDto: VoteStatsQueryDto) {
    const { startDate, endDate } = queryDto;
    // Explicitly parse and set default for limit
    let limit = 10; // Default value
    if (queryDto.limit !== undefined) {
      const parsedLimit = parseInt(String(queryDto.limit), 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }
    // Ensure limit doesn't exceed a max cap for safety, e.g., 100, as defined in DTO
    limit = Math.min(limit, 100);

    const matchDateConditions: any = {};

    if (startDate) {
      matchDateConditions.createdAt = { ...matchDateConditions.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      matchDateConditions.createdAt = { ...matchDateConditions.createdAt, $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
    }

    const aggregationPipeline: any[] = [];

    if (Object.keys(matchDateConditions).length > 0) {
      aggregationPipeline.push({ $match: matchDateConditions });
    }

    aggregationPipeline.push(
      {
        $group: {
          _id: '$user',
          upvotes: { $sum: { $cond: [{ $eq: ['$type', VoteType.UPVOTE] }, 1, 0] } },
          downvotes: { $sum: { $cond: [{ $eq: ['$type', VoteType.DOWNVOTE] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          netVotes: { $subtract: ['$upvotes', '$downvotes'] },
        },
      },
      { $sort: { netVotes: -1 } },
      { $limit: limit }, // Now limit is guaranteed to be a number
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$userDetails.username',
          walletAddress: '$userDetails.walletAddress',
          upvotes: 1,
          downvotes: 1,
          netVotes: 1,
        },
      },
    );

    return this.voteModel.aggregate(aggregationPipeline);
  }
}
