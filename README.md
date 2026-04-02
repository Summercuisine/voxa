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

## ✨ 特性

- 🚀 **现代化技术栈** — Vue 3 + TypeScript + NestJS + PostgreSQL
- 💬 **实时互动** — 基于 WebSocket 的实时通知、在线状态
- 📝 **Markdown 支持** — 完整的 Markdown 编辑器与代码高亮
- 👤 **用户系统** — 注册/登录、个人主页、OAuth 社交登录
- 🏷️ **分类与标签** — 灵活的内容组织方式
- 🔔 **通知系统** — @提及、回复、点赞等多渠道通知
- 🐳 **Docker 部署** — 一键部署，开箱即用
- 📱 **响应式设计** — 完美适配桌面端和移动端
- 🔒 **安全可靠** — JWT 认证、RBAC 权限、输入验证

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────┐
│                   Frontend                   │
│  Vue 3 + Vite + Pinia + Naive UI + Tailwind │
└──────────────────────┬──────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────┐
│                   Backend                    │
│        NestJS + Fastify + Socket.IO          │
├──────────────────────────────────────────────┤
│  Auth │ Users │ Posts │ Comments │ Notify    │
├──────────────────────────────────────────────┤
│              Prisma ORM                      │
└──────┬───────────────────────┬───────────────┘
       │                       │
┌──────▼──────┐    ┌───────────▼──────┐
│ PostgreSQL  │    │      Redis       │
│  (主数据库)  │    │ (缓存/会话/实时)  │
└─────────────┘    └──────────────────┘
```

## 📦 项目结构

```
voxa/
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── api/            # API 接口层
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # 组件
│   │   │   ├── common/     # 通用组件
│   │   │   ├── post/       # 帖子组件
│   │   │   └── user/       # 用户组件
│   │   ├── composables/    # 组合式函数
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
│   │   │   ├── auth/       # 认证模块
│   │   │   ├── users/      # 用户模块
│   │   │   ├── posts/      # 帖子模块
│   │   │   ├── comments/   # 评论模块
│   │   │   ├── categories/ # 分类模块
│   │   │   ├── notifications/ # 通知模块
│   │   │   └── upload/     # 上传模块
│   │   └── prisma/         # Prisma Schema
│   ├── prisma/
│   └── Dockerfile
│
├── docker-compose.yml       # Docker 编排
├── .env.example             # 环境变量模板
└── README.md
```

## 🚀 快速开始

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

## 🛣️ 开发路线图

- [x] 项目初始化与架构搭建
- [ ] **Phase 1 — 基础功能**
  - [ ] 用户注册/登录（JWT 认证）
  - [ ] 帖子 CRUD
  - [ ] 评论系统
  - [ ] 分类/标签管理
- [ ] **Phase 2 — 增强功能**
  - [ ] Markdown 编辑器 + 代码高亮
  - [ ] 图片上传（对象存储）
  - [ ] 用户个人主页
  - [ ] 点赞/收藏系统
- [ ] **Phase 3 — 互动功能**
  - [ ] 实时通知（WebSocket）
  - [ ] @提及
  - [ ] 在线状态
  - [ ] 全文搜索
- [ ] **Phase 4 — 高级功能**
  - [ ] OAuth 社交登录（GitHub/Google）
  - [ ] 管理后台
  - [ ] RBAC 权限系统
  - [ ] 主题定制
- [ ] **Phase 5 — 优化与发布**
  - [ ] 性能优化
  - [ ] 国际化 (i18n)
  - [ ] 单元测试 / E2E 测试
  - [ ] CI/CD 流水线

## 🤝 参与贡献

欢迎任何形式的贡献！请阅读 [贡献指南](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<p align="center">
  Made with ❤️ by the Voxa Community
</p>
