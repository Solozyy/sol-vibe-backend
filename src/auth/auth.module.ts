import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy'; // Sẽ sử dụng sau khi có custom AuthGuard

@Module({
  imports: [
    UsersModule,
    ConfigModule, // Đảm bảo ConfigModule được import
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule ở đây để ConfigService có thể được inject
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '3600s' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy], // JwtStrategy được cung cấp nhưng chưa được sử dụng bởi Guard
  controllers: [AuthController],
  exports: [AuthService, JwtModule] // Export JwtModule nếu cần sử dụng JwtService ở module khác
})
export class AuthModule {}
