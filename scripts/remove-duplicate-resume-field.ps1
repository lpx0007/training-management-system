# 删除专家管理页面中重复的简历字段
# 删除行1149-1169的重复字段

$filePath = "src/pages/ExpertManagement.tsx"

# 读取所有行
$content = Get-Content $filePath

# 创建新内容，跳过要删除的行（1149-1169，转换为0基索引就是1148-1168）
$newContent = @()
for ($i = 0; $i -lt $content.Length; $i++) {
    $lineNumber = $i + 1
    # 跳过1149-1169行
    if ($lineNumber -ge 1149 -and $lineNumber -le 1169) {
        continue
    }
    $newContent += $content[$i]
}

# 写回文件
$newContent | Set-Content $filePath -Encoding UTF8

Write-Host "成功删除行1149-1169的重复简历字段"
Write-Host "删除了 $((1169 - 1149 + 1)) 行"
