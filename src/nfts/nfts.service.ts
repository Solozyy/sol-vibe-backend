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

@Injectable()
export class NftsService {
  private connection: Connection;
  private metaplex: Metaplex;
  private keypair: Keypair;

  constructor() {
    // Initialize Solana connection
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

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

  async create(createNftDto: CreateNftDto) {
    try {
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
        uri: createNftDto.uri,
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
        tokenOwner: creatorPublicKey,
        symbol: 'SOLVIBE',
      });

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
}
