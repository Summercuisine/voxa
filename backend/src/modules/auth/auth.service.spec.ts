import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
    get: jest.fn().mockReturnValue('7d'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access_token and user when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedpassword',
        username: 'testuser',
        role: 'USER',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      // Mock bcrypt.compare - the service uses bcrypt.compare internally
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true as never);

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('test-token');
      expect(result.user).not.toHaveProperty('password');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notfound@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user when userId is valid', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        avatar: null,
        bio: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.objectContaining({ id: true }),
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should create a new user when username and email are unique', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        username: 'newuser',
        email: 'new@test.com',
        avatar: null,
        bio: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register({
        username: 'newuser',
        email: 'new@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('username', 'newuser');
      expect(result).not.toHaveProperty('password');
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ username: 'newuser' }, { email: 'new@test.com' }],
        },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when username already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: '1',
        username: 'existinguser',
        email: 'existing@test.com',
      });

      await expect(
        service.register({
          username: 'existinguser',
          email: 'another@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
