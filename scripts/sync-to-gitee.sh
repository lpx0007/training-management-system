#!/bin/bash

# 同步代码到 Gitee 脚本
# 使用方法: ./scripts/sync-to-gitee.sh "commit message"

echo "🚀 开始同步代码到 GitHub 和 Gitee..."

# 检查是否有提交信息
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供提交信息"
    echo "使用方法: ./scripts/sync-to-gitee.sh \"你的提交信息\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# 添加所有更改
echo "📝 添加更改..."
git add .

# 提交更改
echo "💾 提交更改..."
git commit -m "$COMMIT_MESSAGE"

# 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ GitHub 推送成功"
else
    echo "❌ GitHub 推送失败"
    exit 1
fi

# 检查是否配置了 Gitee 远程仓库
if git remote | grep -q "gitee"; then
    # 推送到 Gitee
    echo "📤 推送到 Gitee..."
    git push gitee main
    
    if [ $? -eq 0 ]; then
        echo "✅ Gitee 推送成功"
    else
        echo "❌ Gitee 推送失败"
        exit 1
    fi
else
    echo "⚠️  未配置 Gitee 远程仓库"
    echo "💡 提示: 运行以下命令添加 Gitee 远程仓库:"
    echo "   git remote add gitee https://gitee.com/your-username/training-management-system.git"
fi

echo ""
echo "🎉 同步完成！"
echo "📊 部署状态:"
echo "   - Netlify: 自动部署中..."
echo "   - EdgeOne: 自动部署中..."
echo ""
echo "🔗 访问链接:"
echo "   - Netlify: https://your-site.netlify.app"
echo "   - EdgeOne: https://your-site.edgeone.app"
