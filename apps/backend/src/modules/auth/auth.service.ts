import { Injectable, Inject, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_DEFINITIONS, verifyPassword, hashPassword, SAFE_USER_SELECT } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || 'fmcg_erp_dms_jwt_secret_anphat_2026_super_key_security';
  }

  /**
   * Tạo token xác thực an toàn HMAC-SHA256
   */
  generateToken(user: any): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const secret = this.getJwtSecret();

    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 ngày
      })
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Xác thực chữ ký số và thời hạn Token chặt chẽ
   */
  verifyToken(token: string): any {
    if (!token) throw new UnauthorizedException('Thiếu token xác thực');

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Định dạng token không hợp lệ');
    }

    const [header, payload, signature] = parts;
    const secret = this.getJwtSecret();

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    // Chống Timing Attack với timingSafeEqual
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Chữ ký số Token không hợp lệ hoặc đã bị can thiệp');
    }

    try {
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
      const now = Math.floor(Date.now() / 1000);
      if (data.exp && data.exp < now) {
        throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      }
      return data;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Dữ liệu payload token không hợp lệ');
    }
  }

  /**
   * Đăng nhập người dùng bằng Username & Password (Đã băm an toàn)
   */
  async login(body: { username: string; password?: string }) {
    if (!body.username || !body.username.trim()) {
      throw new BadRequestException('Vui lòng nhập tên đăng nhập');
    }

    const cleanUsername = body.username.trim().toLowerCase();
    const inputPassword = body.password ? body.password.trim() : '';

    const user = await this.prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản này đã bị tạm khóa. Vui lòng liên hệ Chủ NPP/Quản trị viên');
    }

    // Kiểm tra mật khẩu (hỗ trợ cả mật khẩu băm scrypt và plaintext nâng cấp)
    const isValid = verifyPassword(inputPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    // Tự động nâng cấp mật khẩu lên dạng băm an toàn nếu tài khoản vẫn còn lưu plaintext
    if (user.password && !user.password.includes(':')) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(inputPassword) },
      });
    }

    const token = this.generateToken(user);
    const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS['SALES_REP'];

    return {
      success: true,
      message: `Đăng nhập thành công với vai trò ${roleDef.name}`,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      roleDefinition: roleDef,
      allowedTabs: roleDef.allowedTabs,
    };
  }

  /**
   * Lấy thông tin tài khoản đang đăng nhập (Không lộ trường password)
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    }
    const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS['SALES_REP'];
    return {
      user,
      roleDefinition: roleDef,
      allowedTabs: roleDef.allowedTabs,
    };
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId: string, body: { oldPassword?: string; newPassword?: string }) {
    if (!body.newPassword || body.newPassword.length < 4) {
      throw new BadRequestException('Mật khẩu mới phải có tối thiểu 4 ký tự');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    const isOldValid = verifyPassword(body.oldPassword || '', user.password);
    if (!isOldValid) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(body.newPassword.trim()) },
    });

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }
}
