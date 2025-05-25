import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostAccessLevel } from './schemas/post.schema';
import { IpfsService } from '../ipfs/ipfs.service';
import { NftsService } from '../nfts/nfts.service';
import { UsersService } from '../users/users.service';
import { MembershipsService } from '../memberships/memberships.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private readonly ipfsService: IpfsService,
    private readonly nftsService: NftsService,
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string, userWalletAddress: string) {
    try {
      // Validate user exists (though JwtAuthGuard should handle this)
      const creator = await this.usersService.findById(userId);
      if (!creator) {
        throw new NotFoundException('Creator user not found for post creation.');
      }

      // Upload metadata to IPFS
      const ipfsResult = await this.ipfsService.uploadMetadata({
        content: createPostDto.content,
        image: createPostDto.image,
        walletAddress: userWalletAddress, // Use wallet from authenticated user
      });

      // Create NFT using Metaplex
      const nftResult = await this.nftsService.create({
        name: 'SolVibe Post',
        description: createPostDto.content,
        image: createPostDto.image,
        creator: userWalletAddress, // Use wallet from authenticated user
        uri: ipfsResult.uri,
      });

      const newPost = new this.postModel({
        creator: new Types.ObjectId(userId),
        walletAddress: userWalletAddress, // Wallet address of the creator
        content: createPostDto.content,
        image: createPostDto.image,
        nftUri: ipfsResult.uri,
        accessLevel: createPostDto.accessLevel || PostAccessLevel.PUBLIC,
      });

      const savedPost = await newPost.save();

      return {
        success: true,
        post: savedPost,
        nft: nftResult,
        metadataUri: ipfsResult.uri,
        nftUri: `https://explorer.solana.com/address/${nftResult.nftTokenId}`,
      };
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  async findAll(requestingUserId?: string): Promise<Post[]> {
    const publicPostsQuery = { accessLevel: PostAccessLevel.PUBLIC };
    let memberPostsQuery = {};

    if (requestingUserId) {
      const subscribedCreatorIds = await this.membershipsService.getSubscribedCreatorIds(requestingUserId);
      if (subscribedCreatorIds.length > 0) {
        memberPostsQuery = {
          accessLevel: PostAccessLevel.MEMBERS_ONLY,
          creator: { $in: subscribedCreatorIds },
        };
      }
    }
    // If user is not logged in, or not subscribed to anyone, they only see public posts.
    // If they are subscribed, they see public posts OR member posts they have access to.
    const posts = await this.postModel.find(
        Object.keys(memberPostsQuery).length > 0 ? { $or: [publicPostsQuery, memberPostsQuery] } : publicPostsQuery
    )
    .populate('creator', 'username walletAddress') // Populate creator info
    .sort({ createdAt: -1 })
    .exec();
    return posts;
  }

  async findOne(id: string, requestingUserId?: string): Promise<Post> {
    const post = await this.postModel.findById(id).populate('creator', 'username walletAddress').exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }

    if (post.accessLevel === PostAccessLevel.MEMBERS_ONLY) {
      if (!requestingUserId) {
        throw new ForbiddenException('You must be logged in to view this members-only post.');
      }
      const postCreatorId = post.creator._id.toString(); // Assuming creator is populated or is an ObjectId
      
      // Allow creator to see their own members-only post
      if (requestingUserId === postCreatorId) {
        return post;
      }

      const isMember = await this.membershipsService.isMember(requestingUserId, postCreatorId);
      if (!isMember) {
        throw new ForbiddenException('You must be a member to view this post.');
      }
    }
    return post;
  }

  async update(id: string, updatePostDto: Partial<Post>): Promise<Post> {
    // Add access control if needed: only creator can update?
    const existingPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
    if (!existingPost) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return existingPost;
  }
}
