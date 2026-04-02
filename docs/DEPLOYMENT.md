# Voxa 部署指南

本文档介绍如何将 Voxa 项目部署到生产环境。

## 架构概览

| 组件 | 平台 | 说明 |
|------|------|------|
| 前端 | Vercel | Vue 3 + Vite 静态站点 |
| 后端 | Render | NestJS Docker 容器 |
| 数据库 | Neon | PostgreSQL (Serverless) |

## 一、Vercel 部署前端

1. 登录 [Vercel](https://vercel.com)，使用 GitHub 账号
2. 点击 **"Add New"** -> **"Project"**
3. 选择 voxa 仓库
4. **Root Directory** 设置为 `frontend`
5. **Framework Preset** 选择 Vite
6. 点击 **Deploy**
7. 部署完成后，在 **Settings** -> **Environment Variables** 中添加:

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_BASE_URL` | `https://voxa-backend.onrender.com/api` | 后端 API 地址 |

> 注意：将 `voxa-backend.onrender.com` 替换为你的实际 Render 域名。

## 二、Neon 数据库

1. 登录 [Neon](https://neon.tech)，使用 GitHub 账号
2. 创建新项目，选择离你最近的区域
3. 复制连接字符串
4. 注意区分两种连接字符串：
   - **带 `?pgbouncer=true`** 的连接字符串：用于应用运行时（连接池）
   - **不带 `?pgbouncer=true`** 的连接字符串：用于 Prisma 迁移（直连）

## 三、Render 部署后端

### 方式一：使用 render.yaml（推荐）

1. 登录 [Render](https://render.com)，使用 GitHub 账号
2. 点击 **"New"** -> **"Blueprint"**
3. 连接 voxa 仓库
4. Render 会自动识别 `backend/render.yaml` 配置
5. 确认配置后点击 **Apply**

### 方式二：手动创建

1. 登录 [Render](https://render.com)，使用 GitHub 账号
2. 点击 **"New"** -> **"Web Service"**
3. 连接 voxa 仓库
4. **Root Directory** 设置为 `backend`
5. **Runtime** 选择 Docker
6. **Plan** 选择 Free
7. 添加环境变量（见下方列表）
8. 点击 **Create Web Service**
9. 等待构建完成（首次约 3-5 分钟）

### 环境变量列表

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | Neon 连接字符串(带 pgbouncer) | 数据库连接（运行时） |
| `DIRECT_DATABASE_URL` | Neon 直连字符串(不带 pgbouncer) | Prisma 迁移用 |
| `JWT_SECRET` | 随机强字符串 | JWT 签名密钥 |
| `AI_ENGINE` | `template` | AI 引擎类型 |
| `FRONTEND_URL` | Vercel 域名 | CORS 白名单 |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口 |

> 生成 JWT_SECRET 的方法：在终端运行 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 四、首次部署后

部署完成后，需要在 Render Shell 中初始化数据库：

1. 进入 Render Dashboard -> voxa-backend -> **Shell**
2. 运行以下命令：

```bash
# 推送数据库 Schema
npx prisma db push

# 生成 Prisma Client
npx prisma generate

# （可选）运行种子数据
npx prisma db seed
```

## 五、保持服务活跃

Render 免费服务在 **15 分钟无流量后会自动休眠**，下次请求需要等待约 30-50 秒冷启动。

### 解决方案

1. **UptimeRobot（推荐）**
   - 登录 [UptimeRobot](https://uptimerobot.com)
   - 添加新的 Monitor，类型选择 HTTP(s)
   - URL 填写 `https://voxa-backend.onrender.com/api/health`
   - 监控间隔设置为 5 分钟

2. **前端自动重试**
   - 前端已内置自动重试逻辑，超时或 502/503 时会自动重试最多 2 次
   - 超时时间已设置为 30 秒，足够覆盖冷启动时间

## 六、常见问题

### Q: 部署后前端无法连接后端？
- 检查 Vercel 环境变量 `VITE_API_BASE_URL` 是否正确
- 检查 Render 后端 `FRONTEND_URL` 是否设置为 Vercel 域名
- 检查后端是否已完成冷启动（访问 `/api/health` 查看）

### Q: Prisma 迁移失败？
- 确保使用的是不带 `?pgbouncer=true` 的直连字符串
- 在 Render Shell 中手动运行 `npx prisma db push`

### Q: 如何更新部署？
- 推送到 `main` 分支后，Vercel 和 Render 会自动重新部署
- 如果使用 render.yaml，也可以在 Render Dashboard 手动触发

### Q: 如何查看日志？
- **Vercel**: Dashboard -> 项目 -> Logs
- **Render**: Dashboard -> voxa-backend -> Logs
