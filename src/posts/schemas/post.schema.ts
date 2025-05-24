import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  walletAddress: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  image: string;

  @Prop()
  nftUri?: string;

  @Prop()
  upVote?: number;

  @Prop()
  downVote?: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
