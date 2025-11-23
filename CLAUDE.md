# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于通义千问API的智能聊天助手，纯前端PWA应用，支持语音输入、文字聊天和图片识别。

核心架构：
- **前端渲染**: 纯静态HTML/CSS/JavaScript，无构建步骤
- **API集成**: 阿里云通义千问(qwen-plus模型)
- **三种运行模式**:
  1. 纯静态托管(Vercel) - API直连前端
  2. Node.js代理 (server.js) - 解决CORS
  3. Python代理 (proxy.py) - 解决CORS + 可选DashScope SDK

**注意**: API密钥硬编码在前端代码中，仅用于演示/学习，生产环境需后端代理。

## 常用命令

### 开发运行

```bash
# 方式1: 纯静态HTTP服务器 (推荐用于前端开发)
npm run static                  # Python: http://localhost:8888
python3 -m http.server 8888     # 或直接运行Python命令

# 方式2: Node.js代理服务器 (解决CORS)
npm install                     # 首次需要安装依赖
npm start                       # 或 npm run dev，http://localhost:3000

# 方式3: Python代理服务器 (CORS + API封装)
python3 proxy.py                # http://localhost:3000
```

### 部署

```bash
# Vercel部署
npm run deploy                  # 需先安装: npm i -g vercel
vercel --prod                   # 或直接运行vercel命令

# 构建检查 (实际无构建步骤，只是占位符)
npm run build
```

### 测试API连接

访问 `http://localhost:3000/api/test` (Node.js服务器) 或打开 `test-api.html` 测试API功能。

## 技术架构

### 运行模式选择逻辑

```
用户访问
│
├─ Vercel部署 → 纯静态 → script.js直接调用通义千问API (CORS可能失败)
│
├─ 本地开发
   ├─ 只改前端UI/逻辑 → npm run static (纯静态，8888端口)
   │
   └─ 测试API集成 → npm start (Node代理，3000端口)
                 或 python3 proxy.py (Python代理，3000端口)
```

### API调用流程

**Vercel模式** (script.js:10-12):
```
用户 → script.js → 直接POST到 dashscope.aliyuncs.com
```

**代理模式** (script.js:10设置为'/api/chat'):
```
用户 → script.js → POST /api/chat → server.js/proxy.py → dashscope API
```

### 关键文件职责

- `index.html`: 主页面，聊天界面DOM结构
- `script.js`: 核心逻辑 - 语音识别、摄像头、API调用、消息渲染
- `style.css`: 移动优先响应式样式，类微信UI
- `server.js`: Node.js API代理，CORS处理，通义千问API封装
- `proxy.py`: Python API代理，支持DashScope SDK或原生HTTP请求
- `manifest.json` + `sw.js`: PWA配置，支持添加到主屏幕

### Web API依赖

- **语音识别**: `webkitSpeechRecognition` (Chrome/Edge，script.js:86-130)
- **摄像头**: `navigator.mediaDevices.getUserMedia()` (script.js:200+)
- **PWA**: Service Worker (sw.js)

## 代码修改指南

### 修改API配置

**前端** (script.js:8-13):
```javascript
const API_CONFIG = {
    baseURL: '/api/chat',        // 代理模式: '/api/chat'
                                 // Vercel模式: 通义千问完整URL
    apiKey: 'sk-xxxx',           // 仅Vercel模式用，代理模式在后端
    model: 'qwen-plus'           // 或 'qwen-vl-plus' (视觉模型)
};
```

**Node后端** (server.js:8-13):
```javascript
const API_CONFIG = {
    baseURL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKey: 'sk-xxxx',
    model: 'qwen-plus'
};
```

**Python后端** (proxy.py:53, 100):
```python
dashscope.api_key = "sk-xxxx"  # DashScope SDK模式
api_key = "sk-xxxx"            # HTTP请求模式
```

### 添加新消息类型

1. 修改 `script.js` 中 `addMessage()` 函数 (约150-180行)
2. 在 `style.css` 添加对应样式类 (约200-300行为消息样式区)
3. 更新API调用逻辑 `callQwenAPI()` (约280-350行)

### 调整UI样式

- **聊天气泡**: `style.css` `.message` 系列类 (~200行)
- **底部输入栏**: `style.css` `.input-container` (~400行)
- **按钮样式**: `style.css` `.icon-btn` 系列 (~450行)
- **移动端适配**: `style.css` 底部 `@media` 查询 (~500行)

## 常见问题

### API调用失败

1. **CORS错误** → 使用代理模式 (`npm start` 或 `python3 proxy.py`)
2. **401 Unauthorized** → 检查API密钥是否有效 (script.js/server.js/proxy.py)
3. **网络超时** → 检查通义千问API服务状态

### 语音识别不工作

- 仅Chrome/Edge支持 `webkitSpeechRecognition`
- HTTPS环境要求 (localhost除外)
- 检查浏览器麦克风权限

### 摄像头无法打开

- HTTPS环境要求 (localhost除外)
- 检查浏览器摄像头权限
- 确认设备有可用摄像头

## 安全注意事项

- **API密钥暴露**: 前端硬编码密钥可被任何人查看，仅限演示用途
- **生产部署**: 必须使用后端代理 (server.js/proxy.py)，移除前端密钥
- **定期轮换**: 定期更换API密钥，避免滥用

## 浏览器兼容性

| 功能 | Chrome | Safari | Firefox | Edge |
|------|--------|--------|---------|------|
| 基础聊天 | ✅ | ✅ | ✅ | ✅ |
| 语音识别 | ✅ | ❌ | ❌ | ✅ |
| 摄像头 | ✅ | ✅ | ✅ | ✅ |
| PWA | ✅ | ✅ | ✅ | ✅ |
