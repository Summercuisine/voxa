import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('LikesService', () => {
  let service: LikesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    like: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    bookmark: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggleLike', () => {
    it('should create a like and return { liked: true } when not already liked', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue(null);
      mockPrismaService.like.create.mockResolvedValue({ id: '1', userId: 'u1', postId: 'p1' });

      const result = await service.toggleLike('u1', 'p1');

      expect(result).toEqual({ liked: true });
      expect(mockPrismaService.like.create).toHaveBeenCalledWith({
        data: { userId: 'u1', postId: 'p1' },
      });
    });

    it('should delete the like and return { liked: false } when already liked', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue({ id: '1', userId: 'u1', postId: 'p1' });
      mockPrismaService.like.delete.mockResolvedValue({ id: '1' });

      const result = await service.toggleLike('u1', 'p1');

      expect(result).toEqual({ liked: false });
      expect(mockPrismaService.like.delete).toHaveBeenCalledWith({
        where: { userId_postId: { userId: 'u1', postId: 'p1' } },
      });
    });
  });

  describe('toggleBookmark', () => {
    it('should create a bookmark and return { bookmarked: true } when not already bookmarked', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue(null);
      mockPrismaService.bookmark.create.mockResolvedValue({ id: '1', userId: 'u1', postId: 'p1' });

      const result = await service.toggleBookmark('u1', 'p1');

      expect(result).toEqual({ bookmarked: true });
      expect(mockPrismaService.bookmark.create).toHaveBeenCalledWith({
        data: { userId: 'u1', postId: 'p1' },
      });
    });

    it('should delete the bookmark and return { bookmarked: false } when already bookmarked', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue({ id: '1', userId: 'u1', postId: 'p1' });
      mockPrismaService.bookmark.delete.mockResolvedValue({ id: '1' });

      const result = await service.toggleBookmark('u1', 'p1');

      expect(result).toEqual({ bookmarked: false });
      expect(mockPrismaService.bookmark.delete).toHaveBeenCalledWith({
        where: { userId_postId: { userId: 'u1', postId: 'p1' } },
      });
    });
  });

  describe('isLiked', () => {
    it('should return true when user has liked the post', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue({ id: '1', userId: 'u1', postId: 'p1' });

      const result = await service.isLiked('u1', 'p1');

      expect(result).toBe(true);
    });

    it('should return false when user has not liked the post', async () => {
      mockPrismaService.like.findUnique.mockResolvedValue(null);

      const result = await service.isLiked('u1', 'p1');

      expect(result).toBe(false);
    });
  });

  describe('isBookmarked', () => {
    it('should return true when user has bookmarked the post', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue({ id: '1', userId: 'u1', postId: 'p1' });

      const result = await service.isBookmarked('u1', 'p1');

      expect(result).toBe(true);
    });

    it('should return false when user has not bookmarked the post', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue(null);

      const result = await service.isBookmarked('u1', 'p1');

      expect(result).toBe(false);
    });
  });
});
