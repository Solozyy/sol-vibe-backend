import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { VoteType } from '../schemas/vote.schema';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVoteDto {
  @ApiProperty({ description: 'The ID of the post to vote on', example: '60d5ecb8d3a1f3001b9d8f1a' })
  @IsNotEmpty()
  @IsMongoId()
  postId: string;

  @ApiProperty({ description: 'The type of vote', enum: VoteType, example: VoteType.UPVOTE })
  @IsNotEmpty()
  @IsEnum(VoteType)
  type: VoteType;
} 