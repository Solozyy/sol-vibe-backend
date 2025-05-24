import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export enum VoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

@Schema({ timestamps: true })
export class Vote extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Post', required: true })
  post: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  user: string;

  @Prop({ type: String, enum: VoteType, required: true })
  type: VoteType;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

VoteSchema.index({ post: 1, user: 1 }, { unique: true }); 