import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service'; // Để lấy thông tin user đầy đủ

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService, // Inject UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET')
        }
      );
      // Gắn payload vào request để có thể truy cập ở controller
      // Hoặc tốt hơn là lấy thông tin user đầy đủ và gắn vào request
      const user = await this.usersService.findByWalletAddress(payload.walletAddress);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      request['user'] = { userId: (user._id as any).toString(), walletAddress: user.walletAddress, username: user.username }; 
    } catch (e) {
      console.error("JwtAuthGuard Error: ", e.message);
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 