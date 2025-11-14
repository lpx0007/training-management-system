# 删除专家管理页面中重复的简历字段
$filePath = "src/pages/ExpertManagement.tsx"

# 读取所有行
$lines = Get-Content $filePath

# 创建新内容数组
$newLines = @()

# 遍历所有行，跳过1149-1169行（转为0基索引是1148-1168）
for ($i = 0; $i -lt $lines.Length; $i++) {
    $lineNum = $i + 1
    if ($lineNum -ge 1149 -and $lineNum -le 1169) {
        # 跳过这些行
        continue
    }
    $newLines += $lines[$i]
}

# 写回文件
$newLines | Set-Content $filePath -Encoding UTF8

Write-Output "已删除重复的简历字段 (行1149-1169)"
Write-Output "删除了 21 行"
