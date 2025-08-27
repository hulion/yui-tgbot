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

// Admin panel for viewing logs with Magic UI components
function generateLogPage() {
  const logHtml = logs.map((log, index) => `
    <div class="log-item" style="animation: slideInLeft 0.3s ease-out ${index * 0.02}s both;">
      <div class="log-content">
        <span class="log-text">${log}</span>
      </div>
    </div>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <title>🤖 Telegram Bot Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="30">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { font-family: 'Inter', sans-serif; }
        
        body { 
            background: #000000;
            min-height: 100vh;
            margin: 0;
            overflow-x: hidden;
        }
        
        .glass-card {
            background: #1c1c1e;
            border: 1px solid #2c2c2e;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        .header-title {
            color: #ffffff;
        }
        
        .log-item {
            background: #2c2c2e;
            border: 1px solid #3a3a3c;
            border-radius: 8px;
            margin: 4px 0;
            transition: all 0.2s ease;
            overflow: hidden;
        }
        
        .log-item:hover {
            background: #3a3a3c;
            border-color: #48484a;
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .log-content {
            padding: 12px 16px;
            position: relative;
        }
        
        .log-text {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            color: #ffffff;
            line-height: 1.4;
        }
        
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .stats-card {
            background: #2c2c2e;
            border: 1px solid #3a3a3c;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.2s ease;
        }
        
        .stats-card:hover {
            background: #3a3a3c;
            transform: translateY(-2px);
        }
        
        
        .refresh-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2c2c2e;
            border: 1px solid #3a3a3c;
            border-radius: 20px;
            padding: 10px 16px;
            color: #ffffff;
            font-size: 14px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #34c759;
            border-radius: 50%;
            margin-right: 8px;
            animation: blink 1.5s infinite;
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        .scroll-indicator {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 200px;
            background: #2c2c2e;
            border-radius: 2px;
        }
        
        .scroll-thumb {
            width: 100%;
            height: 50px;
            background: #007AFF;
            border-radius: 2px;
            animation: scrollThumb 8s linear infinite;
        }
        
        @keyframes scrollThumb {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(150px); }
        }
    </style>
</head>
<body>
    
    <div class="refresh-indicator">
        <span class="status-dot"></span>
        自动刷新 30s
    </div>
    
    <div class="scroll-indicator">
        <div class="scroll-thumb"></div>
    </div>
    
    <div class="container mx-auto px-6 py-8">
        <!-- Header Section -->
        <div class="glass-card p-8 mb-8 text-center">
            <h1 class="header-title text-4xl font-semibold mb-4">🤖 Telegram Bot Dashboard</h1>
            <p class="text-white/60 text-lg">实时监控 · 智能分析</p>
        </div>
        
        <!-- Stats Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="stats-card text-center">
                <div class="text-3xl font-bold text-white mb-2">${logs.length}</div>
                <div class="text-white/60">日志条数</div>
            </div>
            <div class="stats-card text-center">
                <div class="text-3xl font-bold text-white mb-2">${new Date().toLocaleTimeString('zh-CN')}</div>
                <div class="text-white/60">当前时间</div>
            </div>
            <div class="stats-card text-center">
                <div class="text-3xl font-bold text-white mb-2">在线</div>
                <div class="text-white/60">运行状态</div>
            </div>
        </div>
        
        <!-- Logs Section -->
        <div class="glass-card p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-semibold text-white">📝 实时日志</h2>
                <div class="text-white/60 text-sm">最新 100 条记录</div>
            </div>
            
            <div class="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                ${logHtml || `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">🔍</div>
                        <div class="text-white/60">暂无日志记录</div>
                        <div class="text-white/40 text-sm mt-2">发送消息给 Bot 来生成日志</div>
                    </div>
                `}
            </div>
        </div>
        
        <!-- Footer Section -->
        <div class="mt-8 glass-card p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/60">
                <div>
                    <div class="flex items-center mb-2">
                        <span class="text-lg mr-2">⏰</span>
                        页面每 30 秒自动刷新
                    </div>
                    <div class="flex items-center">
                        <span class="text-lg mr-2">🤖</span>
                        Bot Token: ***${BOT_TOKEN.slice(-10)}
                    </div>
                </div>
                <div>
                    <div class="flex items-center mb-2">
                        <span class="text-lg mr-2">💾</span>
                        内存存储 (CF Worker 免费版)
                    </div>
                    <div class="flex items-center">
                        <span class="text-lg mr-2">🚀</span>
                        Powered by Magic UI
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #1c1c1e;
            border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #48484a;
            border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #636366;
        }
    </style>
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
  
  // Default response with modern UI
  return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <title>🤖 Telegram Bot</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        body { 
            background: #000000;
            min-height: 100vh;
            margin: 0;
        }
        .glass-card {
            background: #1c1c1e;
            border: 1px solid #2c2c2e;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .nav-link {
            background: #2c2c2e;
            border: 1px solid #3a3a3c;
            transition: all 0.2s ease;
        }
        .nav-link:hover {
            background: #3a3a3c;
            transform: translateY(-1px);
        }
    </style>
</head>
<body class="flex items-center justify-center p-6">
    <div class="glass-card p-8 max-w-md w-full text-center">
        <div class="text-6xl mb-4">🤖</div>
        <h1 class="text-3xl font-bold text-white mb-4">Telegram Bot</h1>
        <p class="text-white/80 mb-8">Worker 正在运行中...</p>
        
        <div class="space-y-4">
            <a href="/logs" class="nav-link block px-6 py-3 rounded-lg text-white no-underline">
                📝 查看日志
            </a>
            <a href="/health" class="nav-link block px-6 py-3 rounded-lg text-white no-underline">
                ❤️ 健康检查
            </a>
        </div>
        
        <div class="mt-8 pt-6 border-t border-white/20">
            <p class="text-white/60 text-sm">
                Webhook 端点：<code class="text-white/80">/webhook</code>
            </p>
        </div>
    </div>
</body>
</html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};