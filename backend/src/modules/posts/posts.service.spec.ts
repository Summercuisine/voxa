import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated posts with meta data', async () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post',
          content: 'Content',
          author: { id: '1', username: 'user1', avatar: null },
          category: null,
          _count: { comments: 5, likes: 10 },
        },
      ];
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should pass search filter to findMany when search query is provided', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'nestjs' });

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'nestjs', mode: 'insensitive' } }),
              expect.objectContaining({ content: { contains: 'nestjs', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a post with full details when found', async () => {
      const mockPost = {
        id: '1',
        title: 'Test Post',
        content: 'Content',
        author: { id: '1', username: 'user1', avatar: null },
        category: null,
        tags: [],
        comments: [],
        _count: { comments: 5, likes: 10 },
      };
      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.post.update.mockResolvedValue({});

      const result = await service.findOne('1');

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('title', 'Test Post');
      expect(mockPrismaService.post.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a post and return it with author and category', async () => {
      const mockPost = {
        id: '1',
        title: 'New Post',
        content: 'New Content',
        author: { id: 'user1', username: 'testuser', avatar: null },
        category: null,
        tags: [],
        _count: { comments: 0, likes: 0 },
      };
      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.create('user1', {
        title: 'New Post',
        content: 'New Content',
      });

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('title', 'New Post');
      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Post',
            content: 'New Content',
            authorId: 'user1',
          }),
        }),
      );
    });
  });
});
