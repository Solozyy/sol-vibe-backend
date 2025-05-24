import { Injectable } from '@nestjs/common';
import { CreateIpfsMetadataDto } from './dto/ipfs-metadata.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';

@Injectable()
export class IpfsService {
  private pinata;

  constructor() {
    // Initialize Pinata
    this.pinata = new pinataSDK(
      process.env.PINATA_API_KEY,
      process.env.PINATA_SECRET_KEY,
    );
  }

  private base64ToBuffer(base64String: string): Buffer {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64String.includes('base64,')
      ? base64String.split('base64,')[1]
      : base64String;

    return Buffer.from(base64Data, 'base64');
  }

  async uploadImage(uploadImageDto: UploadImageDto) {
    try {
      // Convert base64 to Buffer
      const imageBuffer = this.base64ToBuffer(uploadImageDto.file);

      // Convert Buffer to Readable stream
      const stream = Readable.from(imageBuffer);

      const result = await this.pinata.pinFileToIPFS(stream, {
        pinataMetadata: {
          name: uploadImageDto.fileName,
        },
      });

      return `ipfs://${result.IpfsHash}`;
    } catch (error) {
      console.error('Failed to upload image to IPFS:', error);
      throw error;
    }
  }

  async uploadMetadata(metadataDto: CreateIpfsMetadataDto) {
    try {
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
        properties: {
          files: [
            {
              uri: metadataDto.image,
              type: 'image/png',
            },
          ],
          category: 'image',
          creators: [
            {
              address: metadataDto.walletAddress,
              share: 100,
            },
          ],
        },
      };

      const metadataBuffer = Buffer.from(JSON.stringify(metadata));
      const stream = Readable.from(metadataBuffer);

      const result = await this.pinata.pinFileToIPFS(stream, {
        pinataMetadata: {
          name: 'metadata.json',
        },
      });

      return {
        uri: `ipfs://${result.IpfsHash}`,
        metadata,
      };
    } catch (error) {
      console.error('Failed to upload metadata to IPFS:', error);
      throw error;
    }
  }
}
