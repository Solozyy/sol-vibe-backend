import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'YourWalletAddressHere', description: 'User\'s Solana wallet address' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ example: 'john_doe', description: 'Desired username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'John Doe', description: 'User\'s full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Solana enthusiast!', description: 'User\'s biography (optional)', required: false })
  @IsString()
  @IsOptional()
  bio?: string;
}

// Thêm một type alias để UsersService có thể sử dụng mà không cần import class-validator
export type CreateUserDto = RegisterDto;
