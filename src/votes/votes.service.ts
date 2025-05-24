import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vote, VoteType } from './schemas/vote.schema';
import { CreateVoteDto } from './dto/create-vote.dto';
import { PostsService } from '../posts/posts.service';
import { Post } from '../posts/schemas/post.schema';

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
}
