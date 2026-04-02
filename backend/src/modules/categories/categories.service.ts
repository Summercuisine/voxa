import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    // 检查 name 和 slug 是否已存在
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: dto.slug }],
      },
    });

    if (existing) {
      throw new ConflictException('分类名称或 slug 已存在');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    // 检查 name 和 slug 唯一性
    if (dto.name || dto.slug) {
      const existing = await this.prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(dto.name ? [{ name: dto.name }] : []),
                ...(dto.slug ? [{ slug: dto.slug }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        throw new ConflictException('分类名称或 slug 已存在');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: '分类已删除' };
  }
}
