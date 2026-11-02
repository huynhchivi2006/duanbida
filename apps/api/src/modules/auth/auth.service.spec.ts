import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let prisma: any;
  let jwtService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('Đăng ký tài khoản (Register)', () => {
    it('Đăng ký hợp lệ thành công và trả về thông tin user cùng token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'khachhang@gmail.com',
        phone: '0901234567',
        fullName: 'Nguyễn Văn An',
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
      });

      const result = await authService.register({
        email: 'khachhang@gmail.com',
        phone: '0901234567',
        password: 'Password@123',
        fullName: 'Nguyễn Văn An',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('khachhang@gmail.com');
      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.refreshToken).toBe('mocked-jwt-token');
    });

    it('Từ chối đăng ký nếu email đã được sử dụng (409 Conflict)', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'existing-id',
        email: 'khachhang@gmail.com',
      });

      await expect(
        authService.register({
          email: 'khachhang@gmail.com',
          password: 'Password@123',
          fullName: 'Nguyễn Văn An',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Đăng nhập (Login)', () => {
    it('Đăng nhập sai mật khẩu ném lỗi 401 Unauthorized', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'khachhang@gmail.com',
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      await expect(
        authService.login({
          email: 'khachhang@gmail.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Đăng nhập thành công với mật khẩu chính xác', async () => {
      const rawPassword = 'CorrectPassword';
      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'khachhang@gmail.com',
        fullName: 'Nguyễn Văn An',
        role: Role.CUSTOMER,
        passwordHash: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      const result = await authService.login({
        email: 'khachhang@gmail.com',
        password: rawPassword,
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('khachhang@gmail.com');
      expect(result.accessToken).toBe('mocked-jwt-token');
    });
  });

  describe('Đổi mật khẩu (Change Password)', () => {
    it('Từ chối đổi mật khẩu nếu nhập sai mật khẩu cũ', async () => {
      const currentHashed = await bcrypt.hash('OldPassword', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: currentHashed,
      });

      await expect(
        authService.changePassword('user-1', {
          oldPassword: 'WrongOldPassword',
          newPassword: 'NewPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

