# 同步代码到 Gitee 脚本 (PowerShell 版本)
# 使用方法: .\scripts\sync-to-gitee.ps1 "commit message"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 开始同步代码到 GitHub 和 Gitee..." -ForegroundColor Cyan

# 添加所有更改
Write-Host "📝 添加更改..." -ForegroundColor Yellow
git add .

# 提交更改
Write-Host "💾 提交更改..." -ForegroundColor Yellow
git commit -m $CommitMessage

# 推送到 GitHub
Write-Host "📤 推送到 GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ GitHub 推送成功" -ForegroundColor Green
} else {
    Write-Host "❌ GitHub 推送失败" -ForegroundColor Red
    exit 1
}

# 检查是否配置了 Gitee 远程仓库
$giteeRemote = git remote | Select-String "gitee"

if ($giteeRemote) {
    # 推送到 Gitee
    Write-Host "📤 推送到 Gitee..." -ForegroundColor Yellow
    git push gitee main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Gitee 推送成功" -ForegroundColor Green
    } else {
        Write-Host "❌ Gitee 推送失败" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  未配置 Gitee 远程仓库" -ForegroundColor Yellow
    Write-Host "💡 提示: 运行以下命令添加 Gitee 远程仓库:" -ForegroundColor Cyan
    Write-Host "   git remote add gitee https://gitee.com/your-username/training-management-system.git" -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 同步完成！" -ForegroundColor Green
Write-Host "📊 部署状态:" -ForegroundColor Cyan
Write-Host "   - Netlify: 自动部署中..." -ForegroundColor White
Write-Host "   - EdgeOne: 自动部署中..." -ForegroundColor White
Write-Host ""
Write-Host "🔗 访问链接:" -ForegroundColor Cyan
Write-Host "   - Netlify: https://your-site.netlify.app" -ForegroundColor White
Write-Host "   - EdgeOne: https://your-site.edgeone.app" -ForegroundColor White
