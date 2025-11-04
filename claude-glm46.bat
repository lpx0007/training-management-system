@echo off
echo 清除Claude环境变量...
set ANTHROPIC_AUTH_TOKEN=
set ANTHROPIC_API_KEY=
set ANTHROPIC_BASE_URL=
echo 启动Claude (GLM-4.6模型)...
claude %*