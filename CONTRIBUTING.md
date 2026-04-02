# 贡献指南

感谢你对 Voxa 的关注！本文档将帮助你了解如何参与项目开发。

## 开发环境设置

### 前置要求

- Node.js >= 22
- PostgreSQL >= 17
- Redis >= 7
- Git

### 步骤

1. **Fork 并克隆项目**

```bash
git clone https://github.com/your-username/voxa.git
cd voxa
```

2. **安装依赖**

```bash
# 后端
cd backend && npm install

# 前端
cd ../frontend && npm install
```

3. **配置环境变量**

```bash
cp .env.example .env
```

4. **启动开发服务**

```bash
# 终端 1：启动后端
cd backend && npm run start:dev

# 终端 2：启动前端
cd frontend && npm run dev
```

## 代码规范

### 通用规则

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 变量和函数使用 camelCase
- 类型和接口使用 PascalCase
- 常量使用 UPPER_SNAKE_CASE

### Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型 (type):**
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档变更
- `style`: 代码格式（不影响逻辑）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `build`: 构建系统
- `ci`: CI 配置
- `chore`: 杂项

**示例:**
```
feat(auth): add JWT refresh token rotation
fix(posts): resolve markdown rendering XSS vulnerability
docs: update API documentation for v1.0
```

### Pull Request 流程

1. 从 `main` 创建功能分支：`git checkout -b feat/your-feature`
2. 开发并提交代码
3. 确保所有测试通过
4. 创建 Pull Request，描述变更内容
5. 等待 Code Review

## 项目架构

请参考 README.md 中的架构说明。关键原则：

- **后端**: 模块化设计，每个功能模块独立
- **前端**: 组件化开发，关注点分离
- **API**: RESTful 风格，版本化管理
- **数据库**: 通过 Prisma ORM 管理，迁移版本化

## 问题反馈

- 使用 GitHub Issues 提交 Bug 或功能建议
- 提交 Issue 前请先搜索是否已有相同问题
- Bug 报告请附上复现步骤和环境信息

## 许可证

贡献的代码将遵循项目的 MIT 许可证。
