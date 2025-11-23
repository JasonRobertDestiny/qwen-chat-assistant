const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// API配置
const API_CONFIG = {
    baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKey: 'sk-5eca33a68f2d499fa09953b9b308ed0f',
    // 升级为全模态极速版，支持文本/图片/音频输入
    model: 'qwen3-omni-flash'
};

// 中间件
app.use(cors());
app.use(express.json());
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

        const requestBody = {
            model: API_CONFIG.model,
            input: {
                messages: [
                    {
                        role: 'user',
                        content: contentBlocks
                    }
                ]
            },
            parameters: {
                result_format: 'message'
            }
        };

        console.log('发送到通义千问:', JSON.stringify(requestBody).slice(0, 4000));

        const response = await fetch(API_CONFIG.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.apiKey}`,
                'X-DashScope-SSE': 'disable'
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

        if (data.output && data.output.choices && data.output.choices[0]) {
            return res.json({
                success: true,
                message: data.output.choices[0].message.content
            });
        }

        if (data.output && data.output.text) {
            return res.json({
                success: true,
                message: data.output.text
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
