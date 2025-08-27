// Telegram Bot API Token
const BOT_TOKEN = '8422242102:AAGWfvOI2cnnWm5paoJn7sndUSZAGkDTikc';

// KV Namespace for storing data (will be configured in wrangler.toml)
let DATA_KV;

// Simple in-memory storage for logs (limited by CF Worker memory)
let logs = [];

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  logs.push(logEntry);
  
  // Keep only last 100 logs to avoid memory issues
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
  
  console.log(logEntry);
}

// Helper function to send Telegram message
async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    log(`Error sending message: ${error.message}`);
    throw error;
  }
}

// Handle incoming Telegram updates
async function handleTelegramUpdate(update) {
  log(`Received update: ${JSON.stringify(update)}`);
  
  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;
    const username = message.from.username || 'unknown';
    const firstName = message.from.first_name || '';
    const lastName = message.from.last_name || '';
    
    // Store user data
    const userData = {
      userId,
      username,
      firstName,
      lastName,
      chatId,
      timestamp: new Date().toISOString(),
      message: text
    };
    
    log(`User data collected: ${JSON.stringify(userData)}`);
    
    // Store in KV if available (for production use)
    if (DATA_KV) {
      try {
        await DATA_KV.put(`user_${userId}_${Date.now()}`, JSON.stringify(userData));
        log(`Data stored in KV for user ${userId}`);
      } catch (error) {
        log(`Error storing data in KV: ${error.message}`);
      }
    }
    
    // Handle different commands
    if (text.startsWith('/start')) {
      await sendTelegramMessage(chatId, 
        `欢迎使用！👋\n\n` +
        `我是一个数据收集机器人。\n` +
        `可用命令：\n` +
        `/start - 显示欢迎信息\n` +
        `/help - 显示帮助信息\n` +
        `/info - 显示您的信息`);
    } else if (text.startsWith('/help')) {
      await sendTelegramMessage(chatId,
        `帮助信息：\n\n` +
        `📝 发送任何消息给我，我会收集您的数据\n` +
        `🔍 使用 /info 查看您的信息\n` +
        `💬 所有消息都会被记录和分析`);
    } else if (text.startsWith('/info')) {
      await sendTelegramMessage(chatId,
        `您的信息：\n\n` +
        `👤 用户 ID: ${userId}\n` +
        `📛 用户名: @${username}\n` +
        `👋 姓名: ${firstName} ${lastName}\n` +
        `🆔 聊天 ID: ${chatId}\n` +
        `⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
    } else {
      // Echo the message and confirm data collection
      await sendTelegramMessage(chatId,
        `收到您的消息："${text}"\n\n` +
        `✅ 数据已收集并存储\n` +
        `📊 消息长度：${text.length} 字符`);
    }
  }
}

// Admin panel for viewing logs
function generateLogPage() {
  const logHtml = logs.map(log => `<p>${log}</p>`).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Telegram Bot 日志</title>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="30">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .header { background-color: #0088cc; color: white; padding: 20px; border-radius: 5px; }
        .logs { background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px; }
        p { margin: 5px 0; font-family: monospace; font-size: 12px; }
        .footer { margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Telegram Bot 日志监控</h1>
        <p>实时显示最近 100 条日志记录</p>
    </div>
    
    <div class="logs">
        <h2>📝 日志记录 (${logs.length} 条)</h2>
        ${logHtml || '<p>暂无日志记录</p>'}
    </div>
    
    <div class="footer">
        <p>⏰ 页面每 30 秒自动刷新 | 🤖 Bot Token: ***${BOT_TOKEN.slice(-10)}</p>
        <p>💾 由于 CF Worker 免费版限制，日志仅保存在内存中</p>
    </div>
</body>
</html>`;
}

// Main handler
async function handleRequest(request, env) {
  // Set global KV reference
  DATA_KV = env.DATA_KV;
  
  const url = new URL(request.url);
  
  // Log access
  log(`${request.method} ${url.pathname} from ${request.headers.get('CF-Connecting-IP')}`);
  
  // Admin panel for viewing logs
  if (url.pathname === '/logs' || url.pathname === '/admin') {
    return new Response(generateLogPage(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // Webhook endpoint for Telegram
  if (url.pathname === '/webhook' && request.method === 'POST') {
    try {
      const update = await request.json();
      await handleTelegramUpdate(update);
      
      return new Response('OK', { status: 200 });
    } catch (error) {
      log(`Error handling webhook: ${error.message}`);
      return new Response('Error', { status: 500 });
    }
  }
  
  // Health check
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      logs_count: logs.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Default response
  return new Response(`
    <h1>🤖 Telegram Bot Worker</h1>
    <p>Bot 正在运行中...</p>
    <ul>
      <li><a href="/health">健康检查</a></li>
      <li><a href="/logs">查看日志</a></li>
    </ul>
    <p><small>请配置 webhook 到 /webhook 端点</small></p>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};