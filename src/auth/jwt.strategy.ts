import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy, ExtractJwt } from 'passport-jwt'; // Sẽ thay thế bằng logic custom nếu không dùng passport
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config'; // Sẽ cần cài đặt @nestjs/config

// Tạm thời comment out passport-jwt vì yêu cầu không dùng passport
// import { PassportStrategy } from '@nestjs/passport';

@Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) { // Tạm thời comment out
export class JwtStrategy { // Sử dụng class thường thay vì extends PassportStrategy
  constructor(
    private usersService: UsersService,
    private configService: ConfigService, // Sẽ inject ConfigService sau khi cài đặt
  ) {
    // super({ // Tạm thời comment out
    //   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    //   ignoreExpiration: false,
    //   secretOrKey: configService.get('JWT_SECRET'), // Sẽ lấy từ config
    // });
  }

  // Hàm validate này sẽ được gọi bởi AuthGuard (custom hoặc của @nestjs/jwt)
  async validate(payload: any) {
    const user = await this.usersService.findByWalletAddress(payload.walletAddress);
    if (!user) {
      throw new UnauthorizedException();
    }
    // Trả về user object để có thể inject vào request
    // Không nên trả về password hay các thông tin nhạy cảm khác
    return { userId: payload.sub, walletAddress: payload.walletAddress, username: payload.username };
  }

  // Hàm này sẽ thay thế cho việc verify token của passport-jwt
  // Được gọi từ một AuthGuard custom
  async verifyToken(token: string): Promise<any> {
    try {
      // const jwtService = new JwtService({ secret: this.configService.get('JWT_SECRET') }); // Cần JwtService
      // return jwtService.verify(token);
      // Vì chưa có JwtService được inject đúng cách ở đây, sẽ implement sau khi AuthModule hoàn chỉnh
      // Tạm thời throw lỗi để báo hiệu cần implement
      throw new Error('verifyToken not implemented in JwtStrategy without Passport');
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
