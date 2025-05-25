import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema'; // Assuming User schema path

export type MembershipDocument = Membership & Document;

@Schema({ timestamps: true })
export class Membership {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  subscriberUser: Types.ObjectId; // User who is subscribing

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  creatorUser: Types.ObjectId; // User whose content is being subscribed to

  // subscribedAt is covered by timestamps.createdAt
}

export const MembershipSchema = SchemaFactory.createForClass(Membership);

// Unique index to prevent duplicate subscriptions
MembershipSchema.index({ subscriberUser: 1, creatorUser: 1 }, { unique: true }); 