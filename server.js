const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// API配置
const API_CONFIG = {
    // 兼容 OpenAI 风格的聊天接口，便于多模态输入
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: 'sk-5eca33a68f2d499fa09953b9b308ed0f',
    // 升级为全模态极速版，支持文本/图片/音频输入
    model: 'qwen3-omni-flash'
};

// 中间件
app.use(cors());
// 放宽请求体大小以承载音频 Base64
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static('.'));

// API代理路由
app.post('/api/chat', async (req, res) => {
    try {
        console.log('收到聊天请求:', req.body);

        const { message, imageData, audioData } = req.body;

        const contentBlocks = [];

        if (message) {
            contentBlocks.push({ type: 'text', text: message });
        }

        if (imageData) {
            contentBlocks.push({
                type: 'image_url',
                image_url: { url: imageData }
            });
        }

        if (audioData && audioData.data) {
            contentBlocks.push({
                type: 'input_audio',
                input_audio: {
                    data: audioData.data,
                    // 默认使用 wav；前端会按录音格式传递
                    format: audioData.format || 'wav'
                }
            });
        }

        if (!contentBlocks.length) {
            return res.status(400).json({ error: '缺少可用的输入内容' });
        }

        // 兼容模式请求体（与 OpenAI chat/completions 相同）
        const requestBody = {
            model: API_CONFIG.model,
            messages: [
                {
                    role: 'user',
                    content: contentBlocks
                }
            ],
            // 不拉取音频输出，如需音频可补充 modalities: ['text','audio']
            stream: false
        };

        console.log('发送到通义千问:', JSON.stringify(requestBody).slice(0, 4000));

        const response = await fetch(API_CONFIG.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('API响应状态:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误:', errorText);
            return res.status(response.status).json({
                error: `API请求失败: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('API响应:', data);

        // 兼容模式返回 {choices:[{message:{content:[...]}}]}
        if (data.choices && data.choices[0]) {
            const replyContent = data.choices[0].message.content;
            const normalizedReply = Array.isArray(replyContent)
                ? replyContent
                    .filter(item => item && (item.text || item.content))
                    .map(item => item.text || item.content)
                    .join('')
                : replyContent;

            return res.json({
                success: true,
                message: normalizedReply
            });
        }

        console.error('未知响应格式:', data);
        return res.status(500).json({
            error: '未知的API响应格式',
            data: data
        });
    } catch (error) {
        console.error('服务器错误:', error);
        return res.status(500).json({
            error: '服务器内部错误',
            message: error.message
        });
    }
});

// 测试路由
app.get('/api/test', (req, res) => {
    res.json({ message: '服务器运行正常', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器启动成功！`);
    console.log(`📱 前端页面: http://localhost:${PORT}`);
    console.log(`🔧 API测试: http://localhost:${PORT}/api/test`);
    console.log('按 Ctrl+C 停止服务器');
});
