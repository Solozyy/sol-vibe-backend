import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckWalletDto {
  @ApiProperty({ example: 'YourWalletAddressHere', description: 'The Solana wallet address to check' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}
