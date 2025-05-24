import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { IpfsService } from './ipfs.service';
import { CreateIpfsMetadataDto } from './dto/ipfs-metadata.dto';
import { UploadImageDto } from './dto/upload-image.dto';

@Controller('ipfs')
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  @Post('upload-image')
  uploadImage(@Body() uploadImageDto: UploadImageDto) {
    return this.ipfsService.uploadImage(uploadImageDto);
  }

  @Post('upload-metadata')
  uploadMetadata(@Body() metadataDto: CreateIpfsMetadataDto) {
    return this.ipfsService.uploadMetadata(metadataDto);
  }
}
