# 海报生成功能使用指南

## 📋 功能说明

使用火山引擎 AI 自动生成培训海报，通过 Netlify Functions 作为后端代理。

## 🏗️ 技术架构

```
前端 (React)
  ↓ HTTP POST
Netlify Function (Node.js)
  ↓ REST API
火山引擎 API
  ↓ 返回
图片 URL
```

## 🔧 配置步骤

### 1. 获取火山引擎 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 进入「豆包大模型」服务
3. 创建 API Key
4. 复制 API Key

### 2. 配置环境变量

#### 本地开发

在 `.env` 文件中添加：

```bash
VOLCENGINE_API_KEY=your_api_key_here
```

#### 生产环境（Netlify）

1. 进入 Netlify Dashboard
2. 选择你的项目
3. 进入 **Site settings** → **Environment variables**
4. 添加变量：
   - Key: `VOLCENGINE_API_KEY`
   - Value: 你的 API Key

### 3. 本地测试

```bash
# 启动 Netlify Dev（会同时启动前端和 Functions）
netlify dev

# 或者分别启动
pnpm dev          # 前端
netlify functions:serve  # Functions
```

## 💻 使用示例

### 基础用法

```typescript
import { generatePoster } from '@/lib/volcengine/posterService';

// 生成海报
const result = await generatePoster({
  prompt: '专业培训海报，主题：React 高级开发，现代商务风格',
  size: '2K',
});

// 获取图片 URL
const imageUrl = result.data[0].url;
```

### 根据培训信息生成

```typescript
import { generatePoster, generatePosterPrompt } from '@/lib/volcengine/posterService';

// 自动生成提示词
const prompt = generatePosterPrompt({
  name: 'React 高级开发培训',
  startDate: '2025-11-15',
  location: '北京市海淀区',
  expertName: '张三',
});

// 生成海报
const result = await generatePoster({ prompt });
```

## 🎨 支持的参数

### model（模型）
- `doubao-seedream-4-0-250828`（默认）
- 其他火山引擎支持的模型

### size（尺寸）
- `1K` - 1024x1024
- `2K` - 2048x2048（默认）
- `4K` - 4096x4096

## 🐛 故障排查

### 1. 本地开发无法调用

**问题**：`fetch failed` 或 `ECONNREFUSED`

**解决**：
- 确保使用 `netlify dev` 启动（不是 `pnpm dev`）
- 检查端口是否为 8888

### 2. API Key 错误

**问题**：`401 Unauthorized`

**解决**：
- 检查 `.env` 文件中的 `VOLCENGINE_API_KEY`
- 确认 API Key 是否有效
- 检查 API Key 是否有调用权限

### 3. 生产环境无法调用

**问题**：部署后无法生成海报

**解决**：
- 检查 Netlify 环境变量是否配置
- 查看 Netlify Functions 日志
- 确认 API Key 额度是否充足

## 📊 费用说明

火山引擎按调用次数计费，具体价格请查看[官方文档](https://www.volcengine.com/docs/82379/1541595)。

建议：
- 开发环境使用测试 API Key
- 生产环境设置调用频率限制
- 监控 API 使用量

## 🔒 安全注意事项

1. **不要在前端暴露 API Key**
   - ✅ 使用 Netlify Functions 代理
   - ❌ 不要在前端代码中直接调用

2. **环境变量管理**
   - ✅ 使用 `.env` 文件（已加入 `.gitignore`）
   - ❌ 不要提交 API Key 到 Git

3. **访问控制**
   - 考虑添加用户认证
   - 限制调用频率
   - 记录调用日志

## 📚 相关文档

- [火山引擎文生图 API](https://www.volcengine.com/docs/82379/1541523)
- [Netlify Functions 文档](https://docs.netlify.com/functions/overview/)
