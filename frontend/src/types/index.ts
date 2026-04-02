// 用户相关
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// 帖子相关
export interface Post {
  id: string
  title: string
  content: string
  slug: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  authorId: string
  categoryId?: string
  author: User
  category?: Category
  tags: Tag[]
  comments: Comment[]
  _count: { comments: number; likes: number; bookmarks: number }
  createdAt: string
  updatedAt: string
}

export interface PostListItem {
  id: string
  title: string
  slug: string
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  author: User
  category?: Category
  tags: Tag[]
  _count: { comments: number; likes: number; bookmarks: number }
  createdAt: string
}

// 评论相关
export interface Comment {
  id: string
  content: string
  authorId: string
  postId: string
  parentId?: string
  author: User
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

// 分类相关
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  sortOrder: number
  _count: { posts: number }
  createdAt: string
}

// 标签相关
export interface Tag {
  id: string
  name: string
  slug: string
}

// 分页
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
