import { IsString, IsNotEmpty } from 'class-validator';

export class UploadImageDto {
  @IsString()
  @IsNotEmpty()
  file: string; // base64 string

  @IsString()
  @IsNotEmpty()
  fileName: string;
}
