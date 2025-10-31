# UI 设计规范指南

> 本文档提供完整的 UI 设计规范，可用于生成 AI 提示词或指导新项目开发

---

## 设计系统

### 颜色方案

#### 主色调
```css
/* 品牌色 */
--primary: #3b82f6;      /* 蓝色 - 主要操作 */
--primary-dark: #2563eb; /* 深蓝 - Hover 状态 */
--primary-light: #60a5fa;/* 浅蓝 - 背景 */

/* 功能色 */
--success: #10b981;      /* 绿色 - 成功状态 */
--warning: #f59e0b;      /* 橙色 - 警告状态 */
--error: #ef4444;        /* 红色 - 错误状态 */
--info: #3b82f6;         /* 蓝色 - 信息提示 */

/* 中性色 */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

#### 暗色模式
```css
/* 暗色背景 */
--dark-bg-primary: #111827;
--dark-bg-secondary: #1f2937;
--dark-bg-tertiary: #374151;

/* 暗色文字 */
--dark-text-primary: #f3f4f6;
--dark-text-secondary: #d1d5db;
--dark-text-tertiary: #9ca3af;
```

### 字体系统

#### 字体族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
             'Fira Sans', 'Droid Sans', 'Helvetica Neue', 
             sans-serif;
```

#### 字体大小
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

#### 字重
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 间距系统

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

### 圆角系统

```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem;   /* 8px */
--radius-xl: 0.75rem;  /* 12px */
--radius-2xl: 1rem;    /* 16px */
--radius-full: 9999px; /* 圆形 */
```

### 阴影系统

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

---

## 组件设计规范

### 按钮组件

#### 主要按钮
```tsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 
                   text-white rounded-lg shadow-sm 
                   transition-colors duration-200
                   font-medium text-sm">
  主要操作
</button>
```

#### 次要按钮
```tsx
<button className="px-4 py-2 border border-gray-300 
                   hover:bg-gray-50 text-gray-700 
                   rounded-lg transition-colors duration-200
                   font-medium text-sm">
  次要操作
</button>
```

#### 危险按钮
```tsx
<button className="px-4 py-2 bg-red-600 hover:bg-red-700 
                   text-white rounded-lg shadow-sm 
                   transition-colors duration-200
                   font-medium text-sm">
  删除
</button>
```

### 输入框组件

```tsx
<input 
  type="text"
  className="w-full px-4 py-2 rounded-lg 
             border border-gray-300 
             focus:ring-2 focus:ring-blue-500 
             focus:border-transparent
             transition-all duration-200
             dark:bg-gray-700 dark:border-gray-600 
             dark:text-white"
  placeholder="请输入..."
/>
```

### 卡片组件

```tsx
<div className="bg-white dark:bg-gray-800 
                rounded-xl shadow-sm 
                border border-gray-100 dark:border-gray-700
                p-6">
  {/* 卡片内容 */}
</div>
```

### 模态框组件

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black bg-opacity-50 
             z-50 flex items-center justify-center p-4"
  onClick={onClose}
>
  <motion.div
    initial={{ scale: 0.9, y: 20 }}
    animate={{ scale: 1, y: 0 }}
    exit={{ scale: 0.9, y: 20 }}
    className="bg-white dark:bg-gray-800 
               rounded-xl shadow-xl 
               max-w-2xl w-full max-h-[90vh] 
               overflow-y-auto"
    onClick={(e) => e.stopPropagation()}
  >
    {/* 模态框内容 */}
  </motion.div>
</motion.div>
```

---

## 页面布局规范

### 标准页面布局

```tsx
<div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
  {/* 侧边栏 */}
  <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
  
  {/* 移动端遮罩层 */}
  {sidebarOpen && (
    <div 
      className="fixed inset-0 bg-transparent z-20 lg:hidden"
      onClick={() => setSidebarOpen(false)}
    />
  )}
  
  {/* 主内容区域 */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* 顶部导航栏 */}
    <header className="bg-white dark:bg-gray-800 shadow-sm z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-3 
                      flex items-center justify-between">
        {/* 标题和操作按钮 */}
      </div>
    </header>
    
    {/* 页面内容 */}
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      {/* 内容区域 */}
    </main>
  </div>
</div>
```

### 响应式网格

```tsx
{/* 统计卡片网格 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 卡片 */}
</div>

{/* 图表网格 */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* 图表 */}
</div>
```

---

## 动画规范

### 页面过渡

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* 内容 */}
</motion.div>
```

### 悬停效果

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  按钮
</motion.button>
```

### 列表动画

```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    {/* 列表项 */}
  </motion.div>
))}
```

---

## AI 提示词模板

### 创建新页面

```
请创建一个 [页面名称] 页面，包含以下功能：

布局要求：
- 使用标准的侧边栏 + 主内容区域布局
- 顶部导航栏包含页面标题和操作按钮
- 主内容区域使用卡片式设计
- 完全响应式，支持移动端

设计规范：
- 使用 Tailwind CSS 进行样式设计
- 主色调为蓝色 (#3b82f6)
- 支持暗色模式
- 使用 Framer Motion 添加过渡动画
- 按钮使用圆角 (rounded-lg)
- 卡片使用阴影 (shadow-sm)

功能需求：
1. [功能1描述]
2. [功能2描述]
3. [功能3描述]

数据处理：
- 使用 Supabase 进行数据存储
- 通过 supabaseService 调用 API
- 实现错误处理和加载状态

移动端优化：
- 侧边栏在移动端为抽屉式
- 表格在移动端可横向滚动
- 按钮和输入框适配触摸操作
```

### 创建新组件

```
请创建一个 [组件名称] 组件，要求：

组件类型：[展示组件/容器组件/表单组件]

Props 接口：
- prop1: type1 - 描述
- prop2: type2 - 描述

样式要求：
- 使用 Tailwind CSS
- 支持暗色模式
- 响应式设计
- 添加悬停和点击动画

功能要求：
- [功能描述]

使用示例：
<ComponentName prop1={value1} prop2={value2} />
```

---

## 图标使用规范

### Lucide React 图标

```tsx
import { 
  Users,      // 用户
  Calendar,   // 日历
  DollarSign, // 金钱
  Search,     // 搜索
  Plus,       // 添加
  Edit,       // 编辑
  Trash,      // 删除
  Download,   // 下载
  Upload,     // 上传
  Settings,   // 设置
  Bell,       // 通知
  Menu,       // 菜单
  X,          // 关闭
  Check,      // 确认
  ChevronDown,// 下拉
  Filter,     // 筛选
  BarChart2,  // 图表
} from 'lucide-react';

// 使用
<Users size={20} className="text-blue-600" />
```

### Font Awesome 图标

```tsx
{/* 使用 className */}
<i className="fas fa-user"></i>
<i className="fas fa-bars"></i>
<i className="fas fa-times"></i>
<i className="fas fa-bell"></i>
```

---

## 表格设计规范

### 响应式表格

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead className="bg-gray-50 dark:bg-gray-700/50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium 
                       text-gray-500 dark:text-gray-400 
                       uppercase tracking-wider">
          列标题
        </th>
      </tr>
    </thead>
    <tbody className="bg-white dark:bg-gray-800 
                      divide-y divide-gray-200 dark:divide-gray-700">
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 
                     transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          单元格内容
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 表单设计规范

### 表单布局

```tsx
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium 
                        text-gray-700 dark:text-gray-300 mb-1">
        字段标签
      </label>
      <input
        type="text"
        className="w-full px-4 py-2 rounded-lg 
                   border border-gray-300 dark:border-gray-600
                   focus:ring-2 focus:ring-blue-500 
                   focus:border-transparent
                   dark:bg-gray-700 dark:text-white"
        placeholder="请输入..."
      />
    </div>
  </div>
  
  <div className="flex justify-end gap-2">
    <button type="button" className="px-4 py-2 border...">
      取消
    </button>
    <button type="submit" className="px-4 py-2 bg-blue-600...">
      提交
    </button>
  </div>
</form>
```

---

这份 UI 设计指南提供了完整的设计规范和 AI 提示词模板，可以直接用于生成新的页面和组件。
