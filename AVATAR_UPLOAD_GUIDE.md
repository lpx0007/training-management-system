# 头像上传功能使用指南

## ✅ 已完成的功能

### 1. Storage 配置
- ✅ 创建了 `avatars` bucket（公开访问）
- ✅ 配置了 RLS 策略（用户只能上传/修改自己的头像）
- ✅ 文件大小限制：3MB
- ✅ 支持格式：JPG、PNG、WEBP

### 2. 图片处理
- ✅ 自动压缩原图（800x800，质量90%）
- ✅ 自动生成缩略图（200x200，质量80%）
- ✅ 列表显示缩略图（快速加载）
- ✅ 点击查看原图（高清显示）
- ✅ 默认头像（首字母，彩色背景）

### 3. 用户界面
- ✅ 个人设置页面可上传头像
- ✅ Sidebar 显示用户头像
- ✅ 鼠标悬停显示上传提示
- ✅ 上传进度显示
- ✅ 点击头像查看原图

### 4. 权限控制
- ✅ 用户可以修改自己的头像
- ✅ 管理员可以修改所有人的头像（待实现）

## 📁 文件结构

```
src/
├── utils/
│   └── imageUtils.ts              # 图片处理工具
├── lib/
│   └── supabase/
│       ├── storageService.ts      # Storage 服务封装
│       └── supabaseService.ts     # 添加头像更新方法
├── components/
│   ├── AvatarUpload.tsx           # 头像上传组件
│   └── Sidebar.tsx                # 显示用户头像
├── pages/
│   └── ProfileSettings.tsx        # 个人设置页面
└── contexts/
    └── authContext.ts             # User 类型添加 avatar 字段
```

## 🎯 使用方法

### 用户上传头像

1. 登录系统
2. 点击左侧菜单的"个人设置"
3. 点击头像区域
4. 选择图片文件（JPG/PNG/WEBP，最大3MB）
5. 系统自动上传并压缩
6. 上传成功后自动更新显示

### 查看原图

1. 点击头像右下角的"放大镜"图标
2. 在弹出的模态框中查看高清原图
3. 点击任意位置关闭

## 🔧 技术细节

### Storage 路径结构
```
avatars/
├── users/
│   ├── {user_id}_thumb_{timestamp}.jpg    # 缩略图
│   └── {user_id}_original_{timestamp}.jpg # 原图
├── experts/
│   ├── {expert_id}_thumb_{timestamp}.jpg
│   └── {expert_id}_original_{timestamp}.jpg
└── customers/
    ├── {customer_id}_thumb_{timestamp}.jpg
    └── {customer_id}_original_{timestamp}.jpg
```

### 图片处理流程
```
用户选择图片
    ↓
前端验证（格式、大小）
    ↓
生成缩略图（200x200）
    ↓
压缩原图（800x800）
    ↓
上传到 Supabase Storage
    ↓
获取公开 URL
    ↓
更新数据库 avatar 字段
    ↓
刷新页面显示
```

### 默认头像生成
- 使用 Canvas API 生成
- 显示用户名首字母
- 根据名字生成不同背景色
- 白色文字，居中显示

## 🚀 待扩展功能

### 1. 用户管理页面
在用户管理页面添加头像上传功能，管理员可以修改所有用户的头像。

```tsx
<AvatarUpload
  currentAvatar={user.avatar}
  userName={user.name}
  userId={user.id}
  type="user"
  onUploadSuccess={handleAvatarUpload}
  editable={true}
/>
```

### 2. 专家管理页面
在专家管理页面添加头像上传功能。

```tsx
<AvatarUpload
  currentAvatar={expert.avatar}
  userName={expert.name}
  userId={expert.id}
  type="expert"
  onUploadSuccess={handleExpertAvatarUpload}
  editable={true}
/>
```

### 3. 客户管理页面
在客户管理页面添加头像上传功能。

```tsx
<AvatarUpload
  currentAvatar={customer.avatar}
  userName={customer.name}
  userId={customer.id}
  type="customer"
  onUploadSuccess={handleCustomerAvatarUpload}
  editable={true}
/>
```

## 📝 注意事项

1. **文件大小**：上传限制为 3MB，系统会自动压缩
2. **文件格式**：只支持 JPG、PNG、WEBP
3. **权限控制**：用户只能修改自己的头像（RLS 策略）
4. **旧文件清理**：上传新头像时自动删除旧文件
5. **默认头像**：未上传时显示首字母头像

## 🐛 故障排查

### 上传失败
- 检查文件大小是否超过 3MB
- 检查文件格式是否正确
- 检查网络连接
- 查看浏览器控制台错误信息

### 头像不显示
- 检查 Storage bucket 是否为 public
- 检查 RLS 策略是否正确
- 清除浏览器缓存
- 检查数据库 avatar 字段是否更新

### 权限错误
- 确认用户已登录
- 检查 RLS 策略配置
- 确认用户 ID 匹配

## 📊 性能优化

1. **缩略图加载**：列表页使用 200x200 缩略图，加载速度快
2. **原图按需加载**：只在点击查看时加载 800x800 原图
3. **图片压缩**：自动压缩减少存储空间和带宽
4. **CDN 加速**：Supabase Storage 自带 CDN

## 🎨 UI 特性

- 鼠标悬停显示相机图标
- 上传中显示加载动画
- 支持拖拽上传（可扩展）
- 响应式设计，适配移动端
- 暗色模式支持
