import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { NftsService } from '../nfts/nfts.service';
import { CreateNftDto } from '../nfts/dto/create-nft.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private readonly nftsService: NftsService,
    private readonly usersService: UsersService,
  ) {}

  async create(createPostDto: CreatePostDto) {
    try {
      // Create NFT metadata
      const nftDto: CreateNftDto = {
        name: createPostDto.content,
        description: `${createPostDto.content} by ${createPostDto.walletAddress}`,
        image: createPostDto.image,
        creator: createPostDto.walletAddress,
        external_url: `https://solvibe.art/content/${Date.now()}`,
      };

      // Mint NFT
      const nftResult = await this.nftsService.create(nftDto);

      // Create post in database
      const post = new this.postModel({
        user: createPostDto.walletAddress,
        content: createPostDto.content,
        image: createPostDto.image,
        nftUri: nftResult.metadataUri,
      });

      const savedPost = await post.save();

      return {
        success: true,
        post: savedPost,
        nft: nftResult,
      };
    } catch (error) {
      console.error('Failed to create post with NFT:', error);
      throw error;
    }
  }

  async findAll() {
    return this.postModel.find().exec();
  }

  async findOne(id: string) {
    return this.postModel.findById(id).exec();
  }
}
