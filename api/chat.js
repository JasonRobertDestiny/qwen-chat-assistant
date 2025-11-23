/**
 * Vercel Serverless Function - 通义千问API代理
 * 用于Vercel部署，解决CORS和API密钥安全问题
 */

export default async function handler(req, res) {
    // CORS设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, imageData } = req.body;

        if (!message && !imageData) {
            return res.status(400).json({
                success: false,
                error: '请提供消息或图片'
            });
        }

        // API配置 - 从环境变量读取
        const API_KEY = process.env.QWEN_API_KEY || 'sk-5eca33a68f2d499fa09953b9b308ed0f';
        const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
        const MODEL = 'qwen-vl-plus'; // 视觉模型，支持图片分析

        // 构建消息内容
        let content;
        if (imageData) {
            // 有图片时使用多模态格式
            content = [
                {
                    type: 'text',
                    text: message || '请分析这张图片'
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageData
                    }
                }
            ];
        } else {
            // 纯文本
            content = message;
        }

        // 构建请求体
        const requestBody = {
            model: MODEL,
            input: {
                messages: [
                    {
                        role: 'user',
                        content: content
                    }
                ]
            },
            parameters: {
                result_format: 'message'
            }
        };

        console.log('调用通义千问API...', { model: MODEL, hasImage: !!imageData });

        // 调用通义千问API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'X-DashScope-SSE': 'disable'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误:', response.status, errorText);
            return res.status(response.status).json({
                success: false,
                error: `API请求失败: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('API响应:', data);

        // 解析响应
        if (data.output && data.output.choices && data.output.choices[0]) {
            return res.status(200).json({
                success: true,
                message: data.output.choices[0].message.content
            });
        } else if (data.output && data.output.text) {
            return res.status(200).json({
                success: true,
                message: data.output.text
            });
        } else {
            console.error('未知响应格式:', data);
            return res.status(500).json({
                success: false,
                error: '未知的API响应格式',
                data: data
            });
        }

    } catch (error) {
        console.error('服务器错误:', error);
        return res.status(500).json({
            success: false,
            error: '服务器内部错误',
            message: error.message
        });
    }
}
