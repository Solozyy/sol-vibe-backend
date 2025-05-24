import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, index: true })
  walletAddress: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  image: string;

  @Prop()
  nftUri?: string;

  @Prop({ default: 0 })
  upvotesCount: number;

  @Prop({ default: 0 })
  downvotesCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ 'user.walletAddress': 1 }, { unique: false });
