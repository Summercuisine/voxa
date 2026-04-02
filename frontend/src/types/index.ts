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

// Bot 相关
export interface Bot {
  id: string
  name: string
  displayName: string
  avatar?: string
  bio?: string
  personality: string
  topics: string[]
  isActive: boolean
  postFrequency: string
  commentFrequency: string
  autoReply: boolean
  autoMessage: boolean
  user: User
  createdAt: string
}

// 私信相关
export interface Conversation {
  id: string
  type: 'DIRECT'
  lastMessageAt: string
  participants: ConversationParticipant[]
  messages?: Message[]
  _count?: { messages: number }
}

export interface ConversationParticipant {
  id: string
  lastReadAt?: string
  userId: string
  user: User
}

export interface Message {
  id: string
  content: string
  isRead: boolean
  senderId: string
  sender: User
  conversationId: string
  createdAt: string
}

// 通知相关
export interface Notification {
  id: string
  type: 'COMMENT_REPLY' | 'POST_LIKE' | 'COMMENT_LIKE' | 'NEW_MESSAGE' | 'SYSTEM'
  title: string
  content: string
  link?: string
  isRead: boolean
  userId: string
  createdAt: string
}

// 点赞/收藏状态
export interface LikeStatus {
  isLiked: boolean
  isBookmarked: boolean
  likeCount: number
  bookmarkCount: number
}

// 管理后台相关
export interface DashboardStats {
  totalUsers: number
  totalPosts: number
  totalComments: number
  todayNewUsers: number
  todayNewPosts: number
  activeBots: number
  postTrend: { date: string; count: number }[]
  userTrend: { date: string; count: number }[]
}

export interface AdminUser {
  id: string
  username: string
  email: string
  avatar?: string
  role: 'USER' | 'ADMIN'
  isBot: boolean
  isActive?: boolean
  createdAt: string
  _count: { posts: number; comments: number }
}

export interface BotStat {
  botId: string
  botName: string
  displayName: string
  postCount: number
  commentCount: number
  isActive: boolean
}
