import { Injectable } from '@nestjs/common';
import { CreateIpfsMetadataDto } from './dto/ipfs-metadata.dto';
import { UploadImageDto } from './dto/upload-image.dto';

@Injectable()
export class IpfsService {
  uploadImage(uploadImageDto: UploadImageDto) {
    return `This action uploads an image`;
  }

  async uploadMetadata(metadataDto: CreateIpfsMetadataDto) {
    // TODO: Implement actual IPFS metadata upload
    // For now, we'll return a mock NFT URI
    const metadata = {
      name: 'SolVibe Post',
      description: metadataDto.content,
      image: metadataDto.image,
      attributes: [
        {
          trait_type: 'Creator',
          value: metadataDto.walletAddress,
        },
      ],
    };

    // Mock IPFS hash - in real implementation, this would be the actual IPFS hash
    const mockIpfsHash = 'Qm' + Math.random().toString(36).substring(2, 15);
    return `ipfs://${mockIpfsHash}`;
  }
}
