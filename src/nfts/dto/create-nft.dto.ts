import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateNftDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  creator: string;

  @IsNumber()
  @IsOptional()
  seller_fee_basis_points?: number = 500;

  @IsString()
  @IsOptional()
  external_url?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
