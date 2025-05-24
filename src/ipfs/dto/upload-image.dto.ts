import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UploadImageDto {
  @IsString()
  @IsNotEmpty()
  image: string;
}
