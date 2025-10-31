# 培训管理系统项目说明文档

## 项目概述

这是一个现代化的培训管理系统，旨在帮助企业和组织有效管理培训流程、客户信息、业务员绩效以及专家资源。系统提供了完整的培训计划管理、客户跟踪、业绩分析等功能，支持多角色权限管理，确保不同用户类型拥有合适的操作权限。

## 技术栈

### 前端技术
- **React 18+**: 现代化的UI构建库，提供组件化开发体验
- **TypeScript**: 提供类型安全的JavaScript超集，增强代码可维护性
- **Tailwind CSS**: 实用优先的CSS框架，实现快速样式开发
- **React Router DOM**: 处理应用路由和导航
- **Framer Motion**: 提供流畅的动画效果
- **Lucide React**: 线性图标库
- **Recharts**: 数据可视化库，用于创建各类图表
- **Sonner**: 轻量级的toast提示组件
- **Vite**: 高性能的构建工具和开发服务器

### 开发工具
- **ESLint**: 代码质量检查
- **TypeScript Compiler**: 类型检查
- **Vite**: 构建和开发服务器

### 数据存储
- **LocalStorage**: 用于本地数据持久化存储

## 框架结构

项目采用组件化和模块化的架构设计，遵循React最佳实践，确保代码的可维护性和可扩展性。

```
src/
├── App.tsx                # 应用入口和路由配置
├── components/            # 通用组件
│   ├── Empty.tsx          # 空状态组件
│   └── Sidebar.tsx        # 侧边栏导航组件
├── contexts/              # React Context
│   └── authContext.ts     # 认证上下文
├── hooks/                 # 自定义Hooks
│   └── useTheme.ts        # 主题切换Hook
├── lib/                   # 工具函数和服务
│   ├── dataService.ts     # 数据服务
│   └── utils.ts           # 通用工具函数
├── pages/                 # 页面组件
│   ├── CustomerManagement.tsx       # 客户管理
│   ├── Dashboard.tsx                # 仪表盘
│   ├── DataExport.tsx               # 数据导出
│   ├── ExpertManagement.tsx         # 专家管理
│   ├── Home.tsx                     # 首页
│   ├── Login.tsx                    # 登录页面
│   ├── PermissionManagement.tsx     # 权限管理
│   ├── SalesPersonManagement.tsx    # 业务员管理
│   ├── SalesTracking.tsx            # 销售追踪
│   └── TrainingPerformance.tsx      # 培训计划
└── main.tsx               # 应用挂载入口
```

### 核心组件功能说明

1. **Sidebar**: 响应式侧边导航栏，根据用户角色显示不同的导航选项
2. **AuthContext**: 提供全局认证状态管理，包括用户信息、登录状态和权限控制
3. **dataService**: 统一的数据服务类，提供模拟的API接口和数据持久化功能
4. **各页面组件**: 实现不同功能模块，如客户管理、培训计划、专家管理等

## 数据处理

### 数据模型

系统定义了多种数据模型，包括用户(User)、客户(Customer)、专家(Expert)、培训场次(TrainingSession)、业务员(Salesperson)等，通过TypeScript接口确保类型安全。

### 数据服务

`dataService.ts`是系统的数据核心，提供以下功能：

1. **数据持久化**: 使用LocalStorage存储数据，确保刷新页面后数据不丢失
2. **统一API接口**: 提供模拟的CRUD操作，包括用户认证、数据查询、添加、更新和删除
3. **数据过滤和权限控制**: 根据用户角色返回不同范围的数据

### 数据流程

1. 页面组件通过dataService请求数据
2. dataService从LocalStorage加载数据或使用默认数据
3. 根据用户权限进行数据过滤
4. 将处理后的数据返回给页面组件
5. 用户操作触发数据更新，dataService保存变更到LocalStorage

## 本地部署方案

### 前提条件

- Node.js (推荐v16或更高版本)
- pnpm (项目使用的包管理器)

### 安装步骤

1. 克隆项目代码

```bash
git clone <项目仓库地址>
cd <项目目录>
```

2. 安装依赖

```bash
pnpm install
```

3. 本地开发运行

```bash
pnpm dev
```

应用将在 http://localhost:3000 启动

4. 构建生产版本

```bash
pnpm build
```

构建后的文件将生成在 `dist` 目录中

## 线上部署方案

### 部署选项

系统支持多种线上部署方式，以下是推荐的几种方案：

#### 1. Vercel 部署

- 优点：简单快捷，与Vite完美兼容，自动CI/CD
- 步骤：
  - 注册Vercel账号
  - 连接GitHub/GitLab仓库
  - 选择项目并配置构建命令
  - 等待自动部署完成

#### 2. Netlify 部署

- 优点：简单易用，提供免费SSL证书
- 步骤：
  - 注册Netlify账号
  - 连接代码仓库
  - 配置构建命令：`pnpm build`
  - 配置发布目录：`dist/static`
  - 部署站点

#### 3. 传统服务器部署

- 步骤：
  - 构建生产版本：`pnpm build`
  - 将`dist`目录下的文件上传到Web服务器
  - 配置Nginx等Web服务器指向`dist/static`目录
  - 确保服务器已安装Node.js环境

### 环境配置

系统主要通过前端配置，无需复杂的服务器环境变量。如需配置API地址或其他全局设置，可在`src/lib/dataService.ts`中进行修改。

## 权限管理

系统实现了基于角色的访问控制(RBAC)，包括以下角色：

1. **管理员(Admin)**: 拥有系统所有功能的访问权限
2. **业务员(Salesperson)**: 管理自己的客户和培训计划
3. **专家(Expert)**: 查看自己的培训安排和绩效

权限控制通过`AuthContext`中的`hasPermission`和`canViewCustomer`方法实现，确保用户只能访问其权限范围内的功能和数据。

## 浏览器支持

系统支持现代主流浏览器，包括：

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 开发规范

1. **组件化开发**: 每个组件专注于单一功能
2. **类型安全**: 充分利用TypeScript提供类型定义
3. **代码风格**: 遵循一致的命名和编码风格
4. **文件结构**: 按照功能模块组织代码

## 未来优化方向

1. **后端集成**: 替换模拟数据服务，连接真实的后端API
2. **状态管理增强**: 使用Redux或Zustand管理复杂状态
3. **单元测试**: 增加测试覆盖度，提高代码质量
4. **国际化支持**: 添加多语言支持
5. **性能优化**: 实现组件懒加载和代码分割
6. **移动端适配**: 增强移动端用户体验

## 📚 详细文档

本 README 提供了项目的基本概述。如需更详细的技术文档，请访问：

### 📖 [文档中心](./docs/README.md)

文档中心包含：
- **[项目完整文档](./docs/PROJECT_DOCUMENTATION.md)** - 完整的技术文档和开发指南
- **[UI 设计指南](./docs/UI_DESIGN_GUIDE.md)** - 详细的设计规范和组件库
- **[Supabase 快速入门](./docs/SUPABASE_QUICKSTART.md)** - Supabase 配置和部署指南

### 🚀 快速链接

- [本地开发环境设置](./docs/PROJECT_DOCUMENTATION.md#本地开发)
- [Netlify 部署指南](./docs/PROJECT_DOCUMENTATION.md#netlify-部署)
- [API 参考文档](./docs/PROJECT_DOCUMENTATION.md#api-参考)
- [故障排查指南](./docs/PROJECT_DOCUMENTATION.md#故障排查)
- [常见问题 FAQ](./docs/PROJECT_DOCUMENTATION.md#常见问题-faq)

---

## 联系与支持

如有任何问题或需要进一步的支持，请联系项目维护团队。