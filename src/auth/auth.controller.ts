import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CheckWalletDto } from './dto/check-wallet.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication') // Nhóm các API này dưới tag 'Authentication'
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('check-wallet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a wallet address is registered' })
  @ApiResponse({ status: 200, description: 'Returns whether the wallet exists and user details if it does.'})
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input.' })
  async checkWallet(@Body(new ValidationPipe()) checkWalletDto: CheckWalletDto) {
    return this.authService.checkWallet(checkWalletDto.walletAddress);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully, returns a message to sign.'})
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input.' })
  @ApiResponse({ status: 409, description: 'Conflict - Wallet address already registered.' })
  async register(@Body(new ValidationPipe()) registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    // Sau khi đăng ký thành công, yêu cầu ký message
    return this.authService.generateLoginMessage(user.walletAddress);
  }

  // Endpoint này có thể được gọi sau check-wallet (nếu user tồn tại) hoặc sau register (nếu user mới)
  @Post('request-signature') 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a message to sign for login' })
  @ApiBody({ schema: { type: 'object', properties: { walletAddress: { type: 'string', example: 'YourWalletAddressHere' } } } })
  @ApiResponse({ status: 200, description: 'Returns a message to be signed by the wallet.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Wallet address not provided.' })
  // @ApiResponse({ status: 404, description: 'Not Found - User not found for signature request.' }) // Bạn có thể thêm nếu có logic kiểm tra user
  async requestSignatureMessage(@Body('walletAddress') walletAddress: string) {
    // Logic kiểm tra user tồn tại có thể thêm ở đây nếu cần
    // Ví dụ: const user = await this.usersService.findByWalletAddress(walletAddress);
    // if (!user) throw new NotFoundException('User not found for signature request');
    return this.authService.generateLoginMessage(walletAddress);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a signed message and log in' })
  @ApiResponse({ status: 200, description: 'Signature verified, returns JWT access token and user details.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid signature or message.' })
  @ApiResponse({ status: 404, description: 'Not Found - User not found.' })
  async verify(@Body(new ValidationPipe()) verifyDto: VerifyDto) {
    return this.authService.verifySignature(verifyDto);
  }
}
