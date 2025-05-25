import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({
    description: 'The ID of the user (creator) to subscribe to',
    example: '60d5ecb8d3a1f3001b9d8f1a',
  })
  @IsNotEmpty()
  @IsMongoId()
  creatorUserId: string;
} 