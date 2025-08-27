# Telegram Bot on Cloudflare Workers

基于 Cloudflare Workers 的 Telegram Bot，用于收集用户数据并提供简单的日志查看功能。

## 功能特点

- 🤖 接收和处理 Telegram 消息
- 📊 收集用户数据（ID、用户名、消息内容等）
- 📝 实时日志查看（内存存储，最多 100 条）
- 💰 针对 CF Workers 免费版优化
- 🔒 简单的管理面板

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 部署到 Cloudflare Workers

```bash
npm run deploy
```

部署完成后，你会得到一个类似这样的 URL：
`https://telegram-bot.your-subdomain.workers.dev`

### 3. 设置 Telegram Webhook

```bash
node setup-webhook.js https://telegram-bot.your-subdomain.workers.dev
```

### 4. 测试 Bot

在 Telegram 中找到你的 Bot 并发送消息：
- `/start` - 显示欢迎信息
- `/help` - 显示帮助信息  
- `/info` - 显示用户信息

## 管理功能

### 查看日志
访问 `https://your-worker-url.workers.dev/logs` 查看实时日志

### 健康检查
访问 `https://your-worker-url.workers.dev/health` 检查 Bot 状态

## 文件结构

```
.
├── src/
│   └── index.js          # 主要 Worker 代码
├── wrangler.toml         # CF Workers 配置
├── package.json          # 项目配置
├── setup-webhook.js      # Webhook 设置脚本
└── README.md            # 说明文档
```

## CF Workers 免费版限制

- **内存**: 128MB（日志存储在内存中）
- **CPU 时间**: 10ms
- **请求数**: 100,000/天
- **存储**: 无持久化存储（可升级使用 KV）

## 注意事项

1. **日志存储**: 由于免费版限制，日志仅存储在内存中，重启后会丢失
2. **数据持久化**: 当前版本数据不持久化，如需长期存储请升级使用 KV Storage
3. **并发限制**: 免费版有并发请求限制，适合小规模使用

## 开发命令

```bash
# 本地开发
npm run dev

# 部署生产环境
npm run deploy

# 查看实时日志
npm run tail
```

## Bot 信息

- **Token**: 8422242102:AAGWfvOI2cnnWm5paoJn7sndUSZAGkDTikc
- **功能**: 数据收集、消息处理、日志记录

## 安全提醒

- Bot Token 已硬编码在代码中，生产环境建议使用环境变量
- 管理面板无密码保护，请注意访问控制