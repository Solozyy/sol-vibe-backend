import { Injectable } from '@nestjs/common';
import { CreateNftDto } from './dto/create-nft.dto';
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import { Metaplex, keypairIdentity, Nft } from '@metaplex-foundation/js';
import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';

@Injectable()
export class NftsService {
  private connection: Connection;
  private metaplex: Metaplex;
  private pinata;
  private keypair: Keypair;

  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Initialize Pinata
    this.pinata = new pinataSDK(
      process.env.PINATA_API_KEY,
      process.env.PINATA_SECRET_KEY,
    );

    // Create a new keypair for the service
    this.keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_ACCOUNT_KEYPAIR ?? '')),
    );

    // Initialize Metaplex
    this.initializeMetaplex();

    console.info('Service wallet address:', this.keypair.publicKey.toBase58());
  }

  private async initializeMetaplex() {
    try {
      // Initialize Metaplex with the keypair
      this.metaplex = Metaplex.make(this.connection).use(
        keypairIdentity(this.keypair),
      );
    } catch (error) {
      console.error('Failed to initialize Metaplex:', error);
      throw error;
    }
  }

  async uploadToIPFS(file: Buffer, fileName: string): Promise<string> {
    try {
      // Convert Buffer to Readable stream
      const stream = Readable.from(file);

      const result = await this.pinata.pinFileToIPFS(stream, {
        pinataMetadata: {
          name: fileName,
        },
      });

      return `ipfs://${result.IpfsHash}`;
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw error;
    }
  }

  async createMetadata(createNftDto: CreateNftDto): Promise<string> {
    try {
      const metadata = {
        name: createNftDto.name,
        description: createNftDto.description,
        image: createNftDto.image,
        creator: createNftDto.creator,
        seller_fee_basis_points: createNftDto.seller_fee_basis_points || 500,
        attributes: [
          { trait_type: 'Type', value: 'Digital Art' },
          { trait_type: 'Created', value: new Date().toISOString() },
        ],
        external_url: createNftDto.external_url,
      };

      const metadataBuffer = Buffer.from(JSON.stringify(metadata));
      const metadataUri = await this.uploadToIPFS(
        metadataBuffer,
        'metadata.json',
      );
      return metadataUri;
    } catch (error) {
      console.error('Failed to create metadata:', error);
      throw error;
    }
  }

  async mintNFT(createNftDto: CreateNftDto): Promise<Nft> {
    try {
      const metadataUri = await this.createMetadata(createNftDto);

      // Validate and create PublicKey from creator address
      let creatorPublicKey: PublicKey;
      try {
        creatorPublicKey = new PublicKey(createNftDto.creator);
      } catch (error) {
        console.error('Invalid creator address:', createNftDto.creator);
        throw new Error(`Invalid creator address: ${createNftDto.creator}`);
      }

      // Create NFT using Metaplex
      const { nft } = await this.metaplex.nfts().create({
        uri: metadataUri,
        name: createNftDto.name,
        sellerFeeBasisPoints: createNftDto.seller_fee_basis_points || 500,
        creators: [
          {
            address: creatorPublicKey,
            share: 100,
          },
        ],
        isMutable: true,
        updateAuthority: this.keypair,
        mintAuthority: this.keypair,
      });

      return nft;
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      throw error;
    }
  }

  async create(createNftDto: CreateNftDto) {
    try {
      const nft = await this.mintNFT(createNftDto);
      return {
        success: true,
        nftTokenId: nft.address.toBase58(),
        metadataUri: nft.uri,
      };
    } catch (error) {
      console.error('Failed to create NFT:', error);
      throw error;
    }
  }

  async getKeypairBalance(): Promise<number> {
    try {
      const balance = await this.connection.getBalance(this.keypair.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get keypair balance:', error);
      throw error;
    }
  }

  findAll() {
    return `This action returns all nfts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nft`;
  }

  remove(id: number) {
    return `This action removes a #${id} nft`;
  }
}
