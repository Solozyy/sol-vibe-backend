import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PostAccessLevel {
  PUBLIC = 'public',
  MEMBERS_ONLY = 'members_only',
}

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creator: Types.ObjectId;

  @Prop({ required: true, index: true })
  walletAddress: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  image: string;

  @Prop()
  nftUri?: string;

  @Prop({ type: String, enum: PostAccessLevel, default: PostAccessLevel.PUBLIC })
  accessLevel: PostAccessLevel;

  @Prop({ default: 0 })
  upvotesCount: number;

  @Prop({ default: 0 })
  downvotesCount: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Consider removing or re-evaluating this index if walletAddress on Post is redundant with creator
// PostSchema.index({ 'user.walletAddress': 1 }, { unique: false });
