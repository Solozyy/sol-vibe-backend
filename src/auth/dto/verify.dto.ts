import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyDto {
  @ApiProperty({ example: 'YourWalletAddressHere', description: 'User\'s Solana wallet address' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ example: 'Sign to login SolVibe: a1b2c3d4e5f6', description: 'The message that was signed' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'SignatureStringHere', description: 'The signature of the message' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
