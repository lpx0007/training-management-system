# 🌐 多平台部署对比

本文档对比 Netlify 和 EdgeOne 两个部署平台的特点，帮助你选择合适的部署策略。

---

## 📊 平台对比

| 特性 | Netlify | EdgeOne |
|------|---------|---------|
| **访问速度** | 海外快 | 国内快 |
| **CDN 覆盖** | 全球 | 中国大陆 |
| **代码源** | GitHub | Gitee |
| **免费额度** | 100GB/月 | 根据套餐 |
| **自动部署** | ✅ | ✅ |
| **自定义域名** | ✅ | ✅ |
| **HTTPS** | ✅ 自动 | ✅ 自动 |
| **构建时间** | 2-3 分钟 | 2-5 分钟 |
| **回滚功能** | ✅ | ✅ |
| **环境变量** | ✅ | ✅ |
| **预览部署** | ✅ | ✅ |
| **适用场景** | 海外用户 | 国内用户 |

---

## 🎯 部署策略

### 策略 1：单平台部署

#### 仅 Netlify
**适用场景**：
- 主要面向海外用户
- 不需要国内访问优化
- 简单快速部署

**优点**：
- ✅ 配置简单
- ✅ 维护成本低
- ✅ 全球 CDN

**缺点**：
- ❌ 国内访问可能较慢

#### 仅 EdgeOne
**适用场景**：
- 主要面向国内用户
- 需要国内访问优化
- 使用 Gitee 托管代码

**优点**：
- ✅ 国内访问快
- ✅ 符合国内网络环境
- ✅ 腾讯云生态

**缺点**：
- ❌ 海外访问可能较慢

### 策略 2：双平台部署（推荐）

**适用场景**：
- 同时服务国内外用户
- 需要高可用性
- 追求最佳用户体验

**优点**：
- ✅ 全球访问优化
- ✅ 高可用性（一个平台故障时另一个可用）
- ✅ 灵活的流量分配
- ✅ 便于 A/B 测试

**缺点**：
- ❌ 需要维护两个平台
- ❌ 需要同步代码到两个仓库

---

## 🔧 配置对比

### 构建配置

两个平台使用相同的构建配置：

```yaml
# 构建命令
pnpm build

# 输出目录
dist/static

# Node.js 版本
18.x

# 包管理器
pnpm
```

### 环境变量

两个平台可以使用相同的环境变量：

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**注意**：如果需要环境隔离，可以使用不同的 Supabase 项目。

---

## 🚀 部署流程对比

### Netlify 部署流程

```
1. 推送代码到 GitHub
   ↓
2. GitHub 触发 Netlify Webhook
   ↓
3. Netlify 自动构建
   ↓
4. 部署到全球 CDN
   ↓
5. 用户访问（海外快）
```

### EdgeOne 部署流程

```
1. 推送代码到 Gitee
   ↓
2. Gitee 触发 EdgeOne Webhook
   ↓
3. EdgeOne 自动构建
   ↓
4. 部署到国内 CDN
   ↓
5. 用户访问（国内快）
```

### 双平台同步流程

```
1. 本地开发完成
   ↓
2. 运行同步脚本
   ├─→ 推送到 GitHub → Netlify 部署
   └─→ 推送到 Gitee → EdgeOne 部署
   ↓
3. 两个平台同时部署
   ↓
4. 用户根据地域访问不同平台
```

---

## 💰 成本对比

### Netlify

**免费套餐**：
- 100GB 带宽/月
- 300 分钟构建时间/月
- 无限站点
- 自动 HTTPS

**付费套餐**：
- Pro: $19/月
- Business: $99/月

### EdgeOne

**免费套餐**：
- 根据腾讯云套餐
- 新用户有免费额度

**付费套餐**：
- 按量计费
- 包年包月

**建议**：
- 个人项目：使用免费套餐
- 商业项目：根据流量选择合适套餐

---

## 🌍 域名配置策略

### 策略 1：智能 DNS 解析（推荐）

使用 DNS 服务商的智能解析功能：

```
training.example.com
├── 国内线路 → EdgeOne (xxx.edgeone.app)
└── 海外线路 → Netlify (xxx.netlify.app)
```

**优点**：
- ✅ 用户无感知
- ✅ 自动选择最优线路
- ✅ 统一域名

**配置方法**：
1. 在 DNS 服务商添加两条 CNAME 记录
2. 设置线路类型（国内/海外）
3. 分别指向两个平台的域名

**支持智能解析的 DNS 服务商**：
- 阿里云 DNS
- 腾讯云 DNSPod
- Cloudflare（地理位置路由）

### 策略 2：独立域名

使用不同的子域名：

```
# 国内访问
cn.training.example.com → EdgeOne

# 海外访问
global.training.example.com → Netlify

# 或者
training.example.com → EdgeOne (主域名)
en.training.example.com → Netlify (英文版)
```

**优点**：
- ✅ 配置简单
- ✅ 便于区分
- ✅ 可以独立管理

**缺点**：
- ❌ 用户需要选择域名
- ❌ SEO 可能受影响

### 策略 3：单一域名 + 重定向

使用一个主域名，根据用户地理位置重定向：

```javascript
// 在应用中检测用户位置
const userLocation = detectUserLocation();

if (userLocation === 'CN') {
  // 国内用户访问 EdgeOne
  window.location.href = 'https://cn.training.example.com';
} else {
  // 海外用户访问 Netlify
  window.location.href = 'https://global.training.example.com';
}
```

**优点**：
- ✅ 灵活控制
- ✅ 可以添加用户选择

**缺点**：
- ❌ 需要额外代码
- ❌ 首次访问有重定向延迟

---

## 📈 监控和分析

### 推荐监控工具

1. **UptimeRobot**
   - 免费监控服务
   - 支持多个 URL
   - 故障告警

2. **Google Analytics**
   - 流量分析
   - 用户地域分布
   - 性能监控

3. **Sentry**
   - 错误监控
   - 性能追踪
   - 用户反馈

### 监控配置

```javascript
// 在应用中添加监控代码
const platform = window.location.hostname.includes('netlify') 
  ? 'Netlify' 
  : 'EdgeOne';

// 发送到分析服务
analytics.track('page_view', {
  platform: platform,
  url: window.location.href
});
```

---

## 🔄 切换和迁移

### 从单平台切换到双平台

1. **准备工作**
   - ✅ 确保 Netlify 部署正常
   - ✅ 准备 Gitee 账号
   - ✅ 了解 EdgeOne 配置

2. **迁移步骤**
   ```bash
   # 1. 导入代码到 Gitee
   # 2. 配置 EdgeOne 部署
   # 3. 测试 EdgeOne 部署
   # 4. 配置智能 DNS
   # 5. 验证两个平台都正常
   ```

3. **验证清单**
   - [ ] 两个平台都能正常访问
   - [ ] 环境变量配置正确
   - [ ] 功能测试通过
   - [ ] DNS 解析正确
   - [ ] 监控配置完成

### 从双平台切换到单平台

如果决定只使用一个平台：

1. **选择保留的平台**
2. **更新 DNS 配置**
3. **停止另一个平台的部署**
4. **更新文档和链接**

---

## 💡 最佳实践

### 1. 代码管理

```bash
# 使用同步脚本
.\scripts\sync-to-gitee.ps1 "commit message"

# 或配置 Git 别名
git config alias.pushall '!git push origin main && git push gitee main'
git pushall
```

### 2. 环境变量管理

- ✅ 使用相同的环境变量（简化管理）
- ✅ 或使用不同的 Supabase 项目（环境隔离）
- ✅ 定期检查环境变量是否同步

### 3. 部署验证

每次部署后检查：
- [ ] 两个平台都部署成功
- [ ] 功能正常
- [ ] 性能正常
- [ ] 无错误日志

### 4. 监控告警

- ✅ 配置 UptimeRobot 监控两个域名
- ✅ 设置告警通知（邮件/短信）
- ✅ 定期查看监控报告

### 5. 文档维护

- ✅ 记录两个平台的访问地址
- ✅ 更新部署文档
- ✅ 记录配置变更

---

## 🎓 学习资源

### Netlify
- [官方文档](https://docs.netlify.com/)
- [部署指南](./PROJECT_DOCUMENTATION.md#netlify-部署)

### EdgeOne
- [官方文档](https://cloud.tencent.com/document/product/1552)
- [部署指南](./EDGEONE_DEPLOYMENT.md)

### Gitee
- [帮助文档](https://gitee.com/help)
- [Git 教程](https://gitee.com/help/articles/4122)

---

## 📞 技术支持

如有问题：
- 查看平台控制台的构建日志
- 参考本文档的故障排查部分
- 提交 Issue 到项目仓库
- 联系项目维护者

---

## 🎯 快速决策指南

### 我应该选择哪种部署策略？

**只有国内用户** → 仅 EdgeOne  
**只有海外用户** → 仅 Netlify  
**国内外都有用户** → 双平台部署（推荐）  
**个人学习项目** → 任选一个  
**商业项目** → 双平台部署（推荐）

### 我需要配置智能 DNS 吗？

**有自定义域名** → 推荐配置  
**使用平台默认域名** → 不需要  
**追求最佳体验** → 推荐配置

### 我需要环境隔离吗？

**生产环境** → 使用相同的 Supabase  
**测试环境** → 可以使用不同的 Supabase  
**开发环境** → 使用本地 Supabase

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-XX  
**维护者**: [项目维护者]
