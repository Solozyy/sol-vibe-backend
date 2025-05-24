import { Module } from '@nestjs/common';
import { NftsService } from './nfts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from '../posts/schemas/post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  providers: [NftsService],
  exports: [NftsService],
})
export class NftsModule {}
