import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { IpfsService } from '../ipfs/ipfs.service';
import { NftsService } from '../nfts/nfts.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private readonly ipfsService: IpfsService,
    private readonly nftsService: NftsService,
  ) {}

  async create(createPostDto: CreatePostDto) {
    try {
      // Upload metadata to IPFS
      const ipfsResult = await this.ipfsService.uploadMetadata({
        content: createPostDto.content,
        image: createPostDto.image,
        walletAddress: createPostDto.walletAddress,
      });

      // Create NFT using Metaplex
      const nftResult = await this.nftsService.create({
        name: 'SolVibe Post',
        description: createPostDto.content,
        image: createPostDto.image,
        creator: createPostDto.walletAddress,
        uri: ipfsResult.uri,
      });

      // Create post in database
      const post = new this.postModel({
        walletAddress: createPostDto.walletAddress,
        content: createPostDto.content,
        image: createPostDto.image,
        nftUri: ipfsResult.uri,
      });

      const savedPost = await post.save();

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
}
