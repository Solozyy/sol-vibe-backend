import { IsString, IsNotEmpty } from 'class-validator';

export class CreateIpfsMetadataDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}
