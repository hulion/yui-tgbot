// Setup script for Telegram Bot webhook
const BOT_TOKEN = '8422242102:AAGWfvOI2cnnWm5paoJn7sndUSZAGkDTikc';

async function setWebhook(workerUrl) {
  const webhookUrl = `${workerUrl}/webhook`;
  const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  
  console.log(`设置 webhook 到: ${webhookUrl}`);
  
  try {
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        max_connections: 40, // CF Worker 免费版建议值
        allowed_updates: ['message', 'callback_query']
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Webhook 设置成功！');
      console.log(`📍 Webhook URL: ${webhookUrl}`);
    } else {
      console.log('❌ Webhook 设置失败：', result.description);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 设置 webhook 时出错：', error.message);
    throw error;
  }
}

async function getWebhookInfo() {
  const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
  
  try {
    const response = await fetch(telegramApiUrl);
    const result = await response.json();
    
    console.log('📊 当前 Webhook 信息：');
    console.log(JSON.stringify(result.result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ 获取 webhook 信息时出错：', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (typeof window === 'undefined' && process.argv[1].includes('setup-webhook.js')) {
  const workerUrl = process.argv[2];
  
  if (!workerUrl) {
    console.log('使用方法: node setup-webhook.js <WORKER_URL>');
    console.log('例如: node setup-webhook.js https://your-worker.your-subdomain.workers.dev');
    process.exit(1);
  }
  
  console.log('🚀 开始设置 Telegram Bot webhook...\n');
  
  getWebhookInfo()
    .then(() => console.log('\n'))
    .then(() => setWebhook(workerUrl))
    .then(() => console.log('\n✅ 设置完成！'))
    .catch(error => {
      console.error('\n❌ 设置失败：', error.message);
      process.exit(1);
    });
}

module.exports = { setWebhook, getWebhookInfo };