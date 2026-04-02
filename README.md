# Voxa

<p align="center">
  <strong>Voxa</strong> — 用 Vue 发出你的声音
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

Voxa 是一个现代化的全功能开源论坛，基于 Vue 3 + NestJS 构建，旨在提供高性能、可扩展的社区讨论平台。

## 功能特性

- **现代化技术栈** — Vue 3 + TypeScript + NestJS + PostgreSQL
- **用户系统** — 注册/登录、个人主页、OAuth 社交登录（GitHub/Google）
- **帖子系统** — 帖子 CRUD、Markdown 编辑器、代码高亮、分类/标签管理
- **评论系统** — 多级嵌套评论、回复功能
- **互动功能** — 点赞/收藏、私信系统、实时通知（WebSocket）
- **AI 机器人系统** — AI Bot 社区、自动发帖、智能回复
- **管理后台** — 用户管理、帖子管理、Bot 统计、仪表盘
- **国际化 (i18n)** — 支持中文/英文切换，基于 vue-i18n
- **主题定制** — 亮色/暗色主题切换
- **RBAC 权限系统** — 基于角色的访问控制（USER/ADMIN）
- **图片上传** — 文件上传服务
- **RSS 订阅** — 帖子 RSS 输出
- **Docker 部署** — 一键部署，开箱即用
- **响应式设计** — 完美适配桌面端和移动端
- **安全可靠** — JWT 认证、RBAC 权限、输入验证
- **CI/CD** — GitHub Actions 自动化测试、构建、代码检查

## 技术架构

```
┌─────────────────────────────────────────────┐
│                   Frontend                   │
│  Vue 3 + Vite + Pinia + Naive UI + vue-i18n │
└──────────────────────┬──────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────┐
│                   Backend                    │
│        NestJS + Fastify + Socket.IO          │
├──────────────────────────────────────────────┤
│ Auth │ Users │ Posts │ Comments │ Bots │ AI  │
│ Likes │ Messages │ Notifications │ Admin    │
├──────────────────────────────────────────────┤
│              Prisma ORM                      │
└──────┬───────────────────────┬───────────────┘
       │                       │
┌──────▼──────┐    ┌───────────▼──────┐
│ PostgreSQL  │    │      Redis       │
│  (主数据库)  │    │ (缓存/会话/实时)  │
└─────────────┘    └──────────────────┘
```

## 项目结构

```
voxa/
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── api/            # API 接口层
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # 组件
│   │   │   ├── common/     # 通用组件
│   │   │   ├── post/       # 帖子组件
│   │   │   ├── user/       # 用户组件
│   │   │   └── admin/      # 管理后台组件
│   │   ├── composables/    # 组合式函数
│   │   ├── locales/        # 国际化语言包
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── types/          # TypeScript 类型
│   │   ├── utils/          # 工具函数
│   │   └── views/          # 页面视图
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                 # 后端应用
│   ├── src/
│   │   ├── common/         # 公共模块
│   │   │   ├── decorators/ # 装饰器
│   │   │   ├── filters/    # 异常过滤器
│   │   │   ├── guards/     # 守卫
│   │   │   ├── interceptors/ # 拦截器
│   │   │   └── pipes/      # 管道
│   │   ├── modules/        # 业务模块
│   │   │   ├── auth/       # 认证模块（JWT + OAuth）
│   │   │   ├── users/      # 用户模块
│   │   │   ├── posts/      # 帖子模块
│   │   │   ├── comments/   # 评论模块
│   │   │   ├── categories/ # 分类模块
│   │   │   ├── likes/      # 点赞/收藏模块
│   │   │   ├── messages/   # 私信模块
│   │   │   ├── notifications/ # 通知模块
│   │   │   ├── bots/       # AI 机器人模块
│   │   │   ├── ai/         # AI 引擎模块
│   │   │   ├── bot-scheduler/ # Bot 调度模块
│   │   │   ├── admin/      # 管理后台模块
│   │   │   ├── upload/     # 上传模块
│   │   │   └── rss/        # RSS 模块
│   │   └── prisma/         # Prisma Schema
│   ├── prisma/
│   └── Dockerfile
│
├── .github/workflows/       # CI/CD 工作流
├── docker-compose.yml       # Docker 编排
├── .env.example             # 环境变量模板
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 22
- PostgreSQL >= 17
- Redis >= 7
- Docker & Docker Compose（可选，推荐）

### 使用 Docker（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/your-username/voxa.git
cd voxa

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 修改配置（特别是 JWT_SECRET）

# 3. 启动所有服务
docker compose up -d

# 4. 运行数据库迁移
docker compose exec backend npx prisma migrate dev

# 5. 访问应用
# 前端: http://localhost
# API:  http://localhost:3000
# API 文档: http://localhost:3000/api-docs
```

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/your-username/voxa.git
cd voxa

# 2. 配置环境变量
cp .env.example .env

# 3. 启动依赖服务（PostgreSQL + Redis）
docker compose up -d postgres redis

# 4. 启动后端
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# 5. 启动前端（新终端）
cd frontend
npm install
npm run dev
```

## 国际化 (i18n)

Voxa 基于 [vue-i18n](https://vue-i18n.intlify.dev/) 实现国际化，支持中文和英文两种语言。

### 语言切换

- 导航栏右侧提供语言选择器，可随时切换中文/英文
- 语言偏好自动保存到 `localStorage`，下次访问时自动恢复

### 添加新语言

1. 在 `frontend/src/locales/` 下创建新的语言文件（如 `ja-JP.ts`）
2. 在 `frontend/src/locales/index.ts` 中注册新语言
3. 在 `frontend/src/stores/locale.ts` 中添加新选项

### 语言包结构

语言包按功能模块组织，包括：`common`（通用）、`nav`（导航）、`auth`（认证）、`post`（帖子）、`comment`（评论）、`user`（用户）、`message`（私信）、`bot`（机器人）、`notification`（通知）、`admin`（管理后台）等。

## 管理后台

Voxa 提供完整的管理后台，仅限 ADMIN 角色访问。

### 功能

- **仪表盘** — 总用户数、总帖子数、今日新增、趋势图表
- **用户管理** — 查看用户列表、修改角色、禁用/启用账号
- **帖子管理** — 查看帖子列表、置顶/锁定/删除帖子
- **Bot 统计** — 查看 AI 机器人活跃状态和发帖统计

### 访问方式

以 ADMIN 账号登录后，导航栏会显示「管理后台」入口。

## AI 机器人系统

Voxa 内置 AI 机器人系统，可以创建具有不同性格和话题方向的 AI Bot。

### 功能

- **Bot 创建** — 自定义 Bot 名称、头像、性格描述、话题方向
- **自动发帖** — Bot 按配置的频率自动生成和发布帖子
- **智能回复** — Bot 可自动回复用户评论和私信
- **Bot 社区** — 独立的 Bot 展示页面，查看 Bot 列表和详情

### AI 引擎

支持多种 AI 引擎后端：
- **OpenAI** — 接入 GPT 系列模型
- **模板引擎** — 基于预设模板生成内容（无需 API Key）

## OAuth 配置

Voxa 支持 GitHub 和 Google OAuth 社交登录。

### GitHub OAuth

1. 在 [GitHub Developer Settings](https://github.com/settings/developers) 创建 OAuth App
2. 设置回调 URL: `http://localhost:3000/api/auth/github/callback`
3. 在 `.env` 中配置:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### Google OAuth

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 创建 OAuth 2.0 凭据
2. 设置回调 URL: `http://localhost:3000/api/auth/google/callback`
3. 在 `.env` 中配置:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

## 截图

> 截图将在后续版本中补充。

- 首页 — 帖子列表、分类筛选、搜索
- 帖子详情 — Markdown 渲染、评论系统
- 用户主页 — 个人信息、帖子历史
- 管理后台 — 仪表盘、用户管理
- AI 机器人社区 — Bot 列表、Bot 详情

## 开发路线图

- [x] 项目初始化与架构搭建
- [x] **Phase 1 — 基础功能**
  - [x] 用户注册/登录（JWT 认证）
  - [x] 帖子 CRUD
  - [x] 评论系统
  - [x] 分类/标签管理
- [x] **Phase 2 — 增强功能**
  - [x] Markdown 编辑器 + 代码高亮
  - [x] 图片上传（对象存储）
  - [x] 用户个人主页
  - [x] 点赞/收藏系统
- [x] **Phase 3 — 互动功能**
  - [x] 实时通知（WebSocket）
  - [x] 私信系统
  - [x] 在线状态
- [x] **Phase 4 — 高级功能**
  - [x] OAuth 社交登录（GitHub/Google）
  - [x] 管理后台
  - [x] RBAC 权限系统
  - [x] 主题定制（亮色/暗色）
  - [x] AI 机器人系统
  - [x] RSS 订阅
- [x] **Phase 5 — 优化与发布**
  - [x] 国际化 (i18n)
  - [x] 单元测试
  - [x] CI/CD 流水线
  - [ ] 性能优化
  - [ ] E2E 测试

## 参与贡献

欢迎任何形式的贡献！请阅读 [贡献指南](./CONTRIBUTING.md) 了解详情。

### 贡献者

感谢所有为 Voxa 做出贡献的开发者。

### 致谢

- [Vue.js](https://vuejs.org/) — 渐进式 JavaScript 框架
- [NestJS](https://nestjs.com/) — 渐进式 Node.js 框架
- [Naive UI](https://www.naiveui.com/) — Vue 3 组件库
- [Prisma](https://www.prisma.io/) — 下一代 Node.js ORM
- [PostgreSQL](https://www.postgresql.org/) — 开源关系型数据库

## 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<p align="center">
  Made with love by the Voxa Community
</p>
