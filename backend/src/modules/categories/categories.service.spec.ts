import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of categories ordered by sortOrder', async () => {
      const mockCategories = [
        { id: '1', name: 'Tech', slug: 'tech', sortOrder: 1, _count: { posts: 5 } },
        { id: '2', name: 'Life', slug: 'life', sortOrder: 2, _count: { posts: 3 } },
      ];
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      });
    });
  });

  describe('create', () => {
    it('should create a category when name and slug are unique', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        id: '1',
        name: 'New Category',
        slug: 'new-category',
        description: 'A new category',
        icon: null,
      });

      const result = await service.create({
        name: 'New Category',
        slug: 'new-category',
        description: 'A new category',
      });

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('name', 'New Category');
      expect(mockPrismaService.category.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ name: 'New Category' }, { slug: 'new-category' }],
        },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when name or slug already exists', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue({
        id: '1',
        name: 'Existing',
        slug: 'existing',
      });

      await expect(
        service.create({
          name: 'Existing',
          slug: 'new-slug',
          description: 'desc',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const mockCategory = {
        id: '1',
        name: 'Tech',
        slug: 'tech',
        description: 'Technology',
        _count: { posts: 10 },
      };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('1');

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('name', 'Tech');
    });

    it('should throw NotFoundException when category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
