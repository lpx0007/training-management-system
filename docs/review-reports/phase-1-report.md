# 项目精简审计报告 · Phase 1（只读，无改动）

日期：2025-11-12
范围：仅静态阅读与只读工具扫描；本报告未对代码进行任何修改。

---

## 一、摘要结论
- 可移除候选（不影响运行）：
  - DataManagement 模块（页面/服务/hooks/types/组件），功能已分散到各业务页面。
  - Netlify Functions（静态托管+Supabase 后端，当前无需 Functions）。
- 应治理项：
  - App 初始化流程 `console.log` 过多，建议统一由可开关的调试日志替代。
  - PermissionManagement 中存在未使用函数 `toggleCategoryPermissions`。
  - `User.department` 相关类型风格不一致（`string | null` vs `string | undefined`）。
- 依赖与体积建议：
  - 疑似未用：`vite-tsconfig-paths`、（如移除 Functions 则）`@netlify/functions`、`netlify-cli`。
  - 体积较大依赖：`xlsx` / `xlsx-js-style` / `jspdf` / `recharts`，建议按需/懒加载。

---

## 二、明确的冗余/无效代码候选

### 1) DataManagement 模块（已确认不再需要）
- 涉及文件：
  - `src/pages/DataManagement.tsx`
  - `src/lib/services/dataManagementService.ts`
  - `src/hooks/useDataManagementPermissions.ts`
  - `src/types/dataManagement.ts`
  - `src/constants/dataManagement.ts`（若存在）
  - `src/components/DataManagement/FileUpload.tsx`
- 路由：`src/App.tsx` 中未检索到该页面的导入与路由项，疑似已无入口。
- 建议：纳入“低风险移除”批次，删除并清理所有引用。

### 2) Netlify Functions（已确认不再使用）
- 文件：`netlify/functions/generate-poster.ts`
- 相关 devDependencies：`@netlify/functions`、`netlify-cli`
- 建议：纳入“低风险移除”批次，删除目录并移除相关依赖。

### 3) 未使用函数
- 位置：`src/pages/PermissionManagement.tsx`
- 函数：`toggleCategoryPermissions(categoryPermissions: string[])`
- 状态：定义存在（约第 240 行），未见调用。可移除或接入“全选/清空”UI。

### 4) 类型风格不一致
- 现状：`UserWithPermissions.department` 为 `string | null`；使用处有 `string | undefined` 预期。
- 建议：统一为 `string | null` 并在使用处做一致性兜底，或全局统一风格以减少判空分支。

### 5) 日志噪音
- 位置：`src/App.tsx` 初始化流程。
- 建议：封装 `debugLogger`（基于环境变量或 `localStorage.debug` 开关），保留 error/warn，抑制 info/debug。

---

## 三、依赖状态与初步研判（只读）

### 疑似未用依赖（待 depcheck/人工复核）
- `vite-tsconfig-paths`：`vite.config.ts` 未启用该插件，疑似未用。
- `@netlify/functions`、`netlify-cli`：与 Netlify Functions 配套，若移除 Functions，可同时移除。
- `node-fetch`：未在 `src/` 中检索到直接使用，可能被 `scripts/` 间接使用；若保留脚本，可保留。

### 体积较大且可懒加载的依赖
- `xlsx`、`xlsx-js-style`、`jspdf`、`jspdf-autotable`、`recharts`
- 建议：将导出/报表/图表功能改为动态导入（路由级或操作触发时 import），降低首屏体积。

> 说明：运行 depcheck 时因 `tsconfig.json` 含注释导致 JSON 解析提示，但依赖引用映射已得到有效结果。本报告未对依赖做任何改动。

---

## 四、权限/菜单/功能映射一致性
- 结构清晰：
  - 权限常量：`src/constants/permissions.ts`
  - 菜单功能：`src/constants/menuFeatures.ts`
  - 功能-权限映射：`src/constants/featurePermissionMapping.ts`
  - UI 守卫：`src/components/PermissionGuard.tsx`
- 建议：生成“孤儿权限项”清单（权限定义存在但未被 UI/校验/服务引用）。谨慎保留“仅管理员手动分配”的键（如 `performance_view_all_departments`）。

---

## 五、scripts/ 目录用途说明（按你的要求暂时保留）
- 分类及用途：
  - 数据库初始化/修复（一次性）：`add-course-management-menu.sql`、`add-performance-export-permissions.sql`、`init-department-managers.sql`、`sync-permissions-to-database.sql`
  - 数据导入/备份（一次性/运维）：`backup-database.js`、`import-2026-courses.js`、`import-2026-courses.sql`、`seed-announcements.js`
  - 仓库同步辅助：`sync-to-gitee.ps1`、`sync-to-gitee.sh`
  - 迁移脚本（一次性执行）：`scripts/migrations/*.sql`
- 结论：均为“过程性脚本”，不参与构建与运行，保留不影响应用；若未来清理，建议按“批次/时间戳”归档或统一删除。

---

## 六、建议的精简执行顺序（仅计划，不执行）

### 低风险（优先）
1) 移除未使用函数 `toggleCategoryPermissions`（或接入 UI）。
2) 统一 `department` 空值类型风格（最小改动，集中在使用处）。
3) 删除 DataManagement 模块及引用。
4) 删除 Netlify Functions 目录与相关 devDeps。
5) `App.tsx` 引入 `debugLogger`，替换非关键信息 `console.log`。

### 中风险（逐页/逐功能）
6) 权限“孤儿项”清理（逐项提供证据与回滚策略）。
7) 懒加载改造（导出/图表等模块按需加载）。

### 低优先
8) 统一卡片/按钮样式与移动端字体（沿用权限页标准）。
9) `.gitignore` 增补“过程产物”忽略（保留脚本本身）。

---

## 七、验证与回滚计划（Phase 2/3 时执行）
- 全量类型检查与 ESLint（确保无新增告警）。
- 构建与首屏加载对比（记录体积变化与性能影响）。
- 冒烟测试关键页面：权限管理、培训业绩、销售追踪、招商简章、权限测试页。
- 小步提交 + 可回滚：每类清理独立 commit 与说明。

---

## 八、证据摘录（只读）
- 未使用函数：`src/pages/PermissionManagement.tsx` 中 `toggleCategoryPermissions` 定义（约第 240 行）未见调用。
- DataManagement 模块：存在上述相关文件，`src/App.tsx` 路由未见入口。
- Netlify Functions：`netlify/functions/generate-poster.ts`；devDeps 包含 `@netlify/functions`、`netlify-cli`。
- 重依赖引用：`xlsx`/`xlsx-js-style`/`jspdf`/`recharts` 被多页面或导出模块使用。

---

## 九、下一步（仍保持只读）
- 生成未用导出/文件清单（`npx ts-prune` 报告）。
- 完整依赖审计（`npx depcheck` 报告补全）。
- 包体可视化报告（rollup visualizer / source-map-explorer）。
- 权限“孤儿项”对照表（权限定义 vs UI/校验引用）。

> 以上步骤仅生成报告，不修改代码；待你确认后，再按“低风险优先”的策略进入执行阶段。
