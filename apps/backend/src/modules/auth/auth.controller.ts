import { Controller, Post, Body, Get, Req, Headers, Inject, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password?: string }) {
    return this.authService.login(body);
  }

  @Post('change-password')
  async changePassword(
    @Body() body: { userId: string; oldPassword?: string; newPassword?: string }
  ) {
    return this.authService.changePassword(body.userId, body);
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu token xác thực trong header Authorization');
    }
    const token = authHeader.split(' ')[1];
    const payload = this.authService.verifyToken(token);
    return this.authService.getProfile(payload.sub);
  }
}
