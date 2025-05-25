import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostAccessLevel } from '../schemas/post.schema';

export class CreatePostDto {
  @ApiProperty({ description: 'Content of the post' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Image URL for the post' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiPropertyOptional({
    description: 'Access level of the post',
    enum: PostAccessLevel,
    default: PostAccessLevel.PUBLIC,
  })
  @IsOptional()
  @IsEnum(PostAccessLevel)
  accessLevel?: PostAccessLevel = PostAccessLevel.PUBLIC;
}
