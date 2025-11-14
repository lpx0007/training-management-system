# Review Reports（审计与评估报告）

本目录专门用于集中存放项目的只读审计与评估类报告（不包含代码变更）。

## 目的
- 对冗余/无效代码、依赖、打包体积、权限映射等进行阶段性分析与记录。
- 统一归档，便于查阅、对比与回溯。

## 已有报告
- Phase 1：全项目精简审计报告（只读）
  - 位置：`../项目精简审计报告-Phase1.md`
  - 内容：可移除候选（DataManagement、Netlify Functions）、未使用函数、类型一致性、依赖与体积建议、权限映射一致性、scripts 目录用途说明与清理顺序建议。

## 规划中的报告（只读）
- 未用导出/文件清单（ts-prune 报告）
- 依赖审计补充（depcheck 报告）
- 包体可视化报告（rollup visualizer / source-map-explorer）
- 权限“孤儿项”对照表（权限定义 vs UI/校验引用）

## 命名规范
- `phase-<n>-<topic>.md` 或 `phase-<n>-report.md`
- 例如：
  - `phase-2-ts-prune-unused-exports.md`
  - `phase-2-depcheck-unused-deps.md`
  - `phase-2-bundle-analysis.md`
  - `phase-2-permission-orphans.md`

## 说明
- 本目录内文档仅供审阅，均为只读分析，不包含任何代码修改。
- 如需将已有报告移动至本目录，请先确认是否保留原有链接路径的兼容性（避免现有引用失效）。
