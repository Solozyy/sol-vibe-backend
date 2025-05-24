import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { IpfsService } from '../ipfs/ipfs.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private readonly ipfsService: IpfsService,
  ) {}

  async create(createPostDto: CreatePostDto) {
    try {
      // Upload metadata to IPFS
      const nftUri = await this.ipfsService.uploadMetadata({
        content: createPostDto.content,
        image: createPostDto.image,
        walletAddress: createPostDto.walletAddress,
      });

      // Create post in database
      const post = new this.postModel({
        walletAddress: createPostDto.walletAddress,
        content: createPostDto.content,
        image: createPostDto.image,
        nftUri,
      });

      const savedPost = await post.save();

      return {
        success: true,
        post: savedPost,
        nftUri,
      };
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }
}
