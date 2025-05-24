import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NftDocument = Nft & Document;

@Schema({ timestamps: true })
export class Nft {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  creator: string;

  @Prop({ required: true })
  tokenId: string;

  @Prop({ required: true })
  metadataUri: string;

  @Prop({ default: 500 })
  sellerFeeBasisPoints: number;

  @Prop()
  externalUrl?: string;
}

export const NftSchema = SchemaFactory.createForClass(Nft);
