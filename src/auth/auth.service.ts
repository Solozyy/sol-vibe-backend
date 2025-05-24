import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { PublicKey, SignaturePubkeyPair, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private signatureMessages: Map<string, string> = new Map();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async checkWallet(walletAddress: string): Promise<{ exists: boolean; user?: UserDocument | null }> {
    const user = await this.usersService.findByWalletAddress(walletAddress);
    if (user) {
      return { exists: true, user };
    }
    return { exists: false };
  }

  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const existingUserByWallet = await this.usersService.findByWalletAddress(registerDto.walletAddress);
    if (existingUserByWallet) {
      throw new ConflictException('Wallet address already registered');
    }
    // Kiểm tra username có tồn tại chưa (cần thêm hàm findByUsername trong UsersService nếu cần thiết)
    // Hiện tại bỏ qua để đơn giản
    return this.usersService.create(registerDto);
  }

  generateLoginMessage(walletAddress: string): { message: string } {
    const randomString = crypto.randomBytes(16).toString('hex');
    const message = `Sign to login SolVibe: ${randomString}`;
    this.signatureMessages.set(walletAddress, message); // Lưu message để xác thực sau
    return { message };
  }

  async verifySignature(verifyDto: VerifyDto): Promise<{ accessToken: string; user: UserDocument }> {
    const { walletAddress, message, signature } = verifyDto;

    const user = await this.usersService.findByWalletAddress(walletAddress);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storedMessage = this.signatureMessages.get(walletAddress);
    if (storedMessage !== message) {
        throw new UnauthorizedException('Invalid message for signature verification');
    }

    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(walletAddress);

      // @ts-ignore // tweetnacl không có type declaration chính thức trên DefinitelyTyped
      const nacl = (await import('tweetnacl')).default;
      const signatureVerified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

      if (!signatureVerified) {
        throw new UnauthorizedException('Invalid signature');
      }

      this.signatureMessages.delete(walletAddress); // Xóa message sau khi xác thực thành công

      const payload = { sub: (user._id as any).toString(), walletAddress: user.walletAddress, username: user.username };
      const accessToken = this.jwtService.sign(payload);

      return { accessToken, user };
    } catch (error) {
      console.error('Signature verification error:', error);
      throw new UnauthorizedException('Signature verification failed');
    }
  }
}
